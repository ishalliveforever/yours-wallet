import {
  Bsv20Indexer,
  Bsv21Indexer,
  FundIndexer,
  Indexer,
  IndexMode,
  InscriptionIndexer,
  LockIndexer,
  MapIndexer,
  // OneSatIndexer,
  OneSatWebSPV,
  OrdLockIndexer,
  OriginIndexer,
  ParseMode,
  SigmaIndexer,
  CosignIndexer,
} from 'spv-store';
import { NetWork } from 'yours-wallet-provider';
import { BlockHeightTrackerMessage } from './hooks/useBlockHeightTracker';
import { FetchingMessage, ImportTrackerMessage, QueueTrackerMessage } from './hooks/useQueueTracker';
import { YoursEventName } from './inject';
import { ChromeStorageService } from './services/ChromeStorage.service';
import { sendMessage } from './utils/chromeHelpers';
import { theme } from './theme';
import { MNEE_DECIMALS, MNEE_ICON_ID, MNEE_SYM, MNEE_TOKEN_ID } from './utils/constants';
import { MNEEIndexer } from './utils/mneeIndexer';

export const getIndexers = (owners: Set<string>, network: NetWork) => {
  const SYNC_HISTORY = false;
  const indexers: Indexer[] = [new FundIndexer(owners, network, SYNC_HISTORY), new CosignIndexer(owners, network)];
  const lockIndexer = new LockIndexer(owners, network, SYNC_HISTORY);
  const bsv20Indexers = [
    new Bsv21Indexer(
      owners,
      IndexMode.Trust,
      [
        {
          id: MNEE_TOKEN_ID,
          icon: MNEE_ICON_ID,
          sym: MNEE_SYM,
          dec: MNEE_DECIMALS,
          op: 'deploy+mint',
          amt: 0n,
          fundAddress: '',
          status: 1,
        },
      ],
      network,
    ),
    new Bsv20Indexer(owners, IndexMode.Trust, network),
  ];

  const mneeIndexer = new MNEEIndexer(owners, network);

  const ordIndexers = [
    // new OneSatIndexer(owners, network, SYNC_HISTORY),
    new OrdLockIndexer(owners, network),
    new InscriptionIndexer(owners, network),
    new MapIndexer(owners, network),
    new SigmaIndexer(owners, network),
    new OriginIndexer(owners, network, SYNC_HISTORY),
  ];

  if (theme.settings.services.locks) indexers.push(lockIndexer);
  if (theme.settings.services.ordinals) {
    indexers.push(...ordIndexers);
  }
  if (theme.settings.services.bsv20) indexers.push(...bsv20Indexers);
  if (theme.settings.services.mnee) {
    indexers.push(mneeIndexer);
  }
  return indexers;
};

export const getOwners = (chromeStorageService: ChromeStorageService) => {
  const { account } = chromeStorageService.getCurrentAccountObject();
  let { bsvAddress, identityAddress, ordAddress } = account?.addresses || {};
  if (!bsvAddress) bsvAddress = '';
  if (!identityAddress) identityAddress = '';
  if (!ordAddress) ordAddress = '';
  return new Set<string>([bsvAddress, identityAddress, ordAddress]);
};

export const initOneSatSPV = async (chromeStorageService: ChromeStorageService, startSync = false) => {
  const { selectedAccount, account } = chromeStorageService.getCurrentAccountObject();
  const network = chromeStorageService.getNetwork();
  const syncSources = new Set<string>(['fund', 'lock']);

  // Set true to sync full history of transactions.
  const owners = getOwners(chromeStorageService);
  const indexers = getIndexers(owners, network);

  if (theme.settings.services.ordinals) {
    syncSources.add('origin');
  }

  if (theme.settings.services.mnee) {
    syncSources.add('mnee');
  }

  const oneSatSPV = await OneSatWebSPV.init(
    selectedAccount || '',
    indexers,
    owners,
    network == NetWork.Mainnet ? NetWork.Mainnet : NetWork.Testnet,
    startSync && !!account,
    syncSources,
    ParseMode.Persist,
  );

  if (!oneSatSPV) throw Error('SPV not initialized!');

  await registerEventListeners(oneSatSPV, selectedAccount || '', startSync);

  return oneSatSPV;
};

const registerEventListeners = async (oneSatSPV: OneSatWebSPV, selectedAccount: string, startSync: boolean) => {
  oneSatSPV.events.on('queueStats', (data: { length: number }) => {
    const message: QueueTrackerMessage = { action: YoursEventName.QUEUE_STATUS_UPDATE, data };
    try {
      sendMessage(message);
      // eslint-disable-next-line no-empty
    } catch (e) {}
  });

  oneSatSPV.events.on('importing', (data: { tag: string; name: string }) => {
    const message: ImportTrackerMessage = { action: YoursEventName.IMPORT_STATUS_UPDATE, data };
    message.data.tag === 'wallet' && localStorage.setItem('walletImporting', 'true');
    try {
      sendMessage(message);
      // eslint-disable-next-line no-empty
    } catch (e) {}
  });

  oneSatSPV.events.on('fetchingTx', (data: { txid: string }) => {
    const message: FetchingMessage = { action: YoursEventName.FETCHING_TX_STATUS_UPDATE, data };
    try {
      sendMessage(message);
      // eslint-disable-next-line no-empty
    } catch (e) {}
  });

  // Debug: log all known events emitted by oneSatSPV.events
  const debugEvents = [
    'queueStats',
    'importing',
    'fetchingTx',
    'syncedBlockHeight',
    'synced',
    'syncing',
    'error',
    'ready',
    'block',
    'blockHeight',
    'blockSynced',
    'blockProcessed',
    'blockHeader',
    'blockHeaders',
    'blockTip',
    'blockchainProgress',
    'progress',
    'walletSynced',
    'walletSyncing',
    'walletReady',
    'walletError',
    'walletBlock',
    'walletBlockSynced',
    'walletBlockProcessed',
    'walletBlockHeader',
    'walletBlockHeaders',
    'walletBlockTip',
    'walletBlockchainProgress',
    'walletProgress',
    // add more if needed
  ];
  debugEvents.forEach(eventName => {
    oneSatSPV.events.on(eventName, (...args: any[]) => {
      console.log(`[initSPVStore] oneSatSPV.events emitted: ${eventName}`, ...args);
    });
  });

  if (startSync) {
    oneSatSPV.events.on('syncedBlockHeight', async (lastHeight: number) => {
      console.log('[initSPVStore] syncedBlockHeight event fired:', lastHeight);
      try {
        const tip = await oneSatSPV.getChaintip();
        const message: BlockHeightTrackerMessage = {
          action: YoursEventName.BLOCK_HEIGHT_UPDATE,
          data: { currentHeight: tip?.height || 0, lastHeight, syncing: false },
        };
        selectedAccount && sendMessage(message);
        // eslint-disable-next-line no-empty
      } catch (error) {}
    });

    // --- POLLING SYNC PROGRESS FOR UI ---
    let syncInterval: NodeJS.Timeout | null = null;
    const pollSyncProgress = async () => {
      try {
        const tip = await oneSatSPV.getChaintip();
        const synced = await oneSatSPV.getSyncedBlock?.();
        // Use only the height comparison for syncing
        const isSyncing = synced && tip && synced.height < tip.height;
        console.log('[initSPVStore][pollSyncProgress] tip:', tip?.height, 'synced:', synced?.height, 'isSyncing:', isSyncing);
        if (tip && synced) {
          const message: BlockHeightTrackerMessage = {
            action: YoursEventName.BLOCK_HEIGHT_UPDATE,
            data: { currentHeight: tip.height, lastHeight: synced.height, syncing: !!isSyncing },
          };
          sendMessage(message);
          // Stop polling if fully synced and not actively syncing
          if (synced.height >= tip.height && !isSyncing) {
            if (syncInterval) clearInterval(syncInterval);
          }
        }
      } catch (e) {
        // ignore
      }
    };
    syncInterval = setInterval(pollSyncProgress, 2000);
    pollSyncProgress();
    // --- END POLLING ---
  }
};
