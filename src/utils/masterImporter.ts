import JSZip from 'jszip';
import { OneSatWebSPV } from 'spv-store';
import { ChromeStorageService } from '../services/ChromeStorage.service';
import { Account, ChromeStorageObject } from '../services/types/chromeStorage.types';
import { sleep } from './sleep';
import { getIndexers, getOwners } from '../initSPVStore';

export type MasterBackupProgressEvent = {
  message: string;
  value?: number;
  endValue?: number;
};

type MasterBackupProgress = (event: MasterBackupProgressEvent) => void;

export const restoreMasterFromZip = async (
  chromeStorageService: ChromeStorageService,
  progress: MasterBackupProgress,
  file: File,
) => {
  const zip = new JSZip();

  const readChromeStorage = async (zip: JSZip) => {
    progress({ message: 'Reading chrome storage...' });
    await sleep(1000);
    const chromeObjectFile = zip.file('chromeStorage.json');
    if (chromeObjectFile) {
      const chromeObjectData = await chromeObjectFile.async('string');
      const chromeObject = JSON.parse(chromeObjectData);
      return chromeObject as ChromeStorageObject;
    } else {
      throw new Error('Chrome storage data not found in zip.');
    }
  };

  const restoreTxns = async (zip: JSZip) => {
    progress({ message: 'Restoring transactions data...' });
    await sleep(1000);
    const txnFiles = zip.file(/^txns-.*.bin$/);
    if (txnFiles.length > 0) {
      let count = 0;
      const endValue = txnFiles.length;
      const spvWallet = await OneSatWebSPV.init('', []);
      for (const txnFile of txnFiles) {
        const txnData = await txnFile.async('uint8array');
        await spvWallet.restoreTxns(Array.from(txnData));
        progress({
          message: `Restored ${count + 1} of ${endValue} txn pages...`,
          value: count,
          endValue,
        });
        count++;
      }
      await spvWallet.destroy();

      progress({ message: 'Txns restored successfully!' });
      await sleep(1000);
    } else {
      progress({ message: 'No transactions found in backup.' });
    }
  };

  const restoreTxos = async (zip: JSZip, accounts: Account[]) => {
    progress({ message: 'Restoring transaction outputs...' });
    await sleep(1000);

    const network = chromeStorageService.getNetwork();
    for (const account of accounts) {
      const owners = getOwners(chromeStorageService);
      const indexers = getIndexers(owners, network);
      const spvWallet = await OneSatWebSPV.init(account.addresses.identityAddress, indexers);
      const txoFiles = zip.file(new RegExp(`txos-${account.addresses.identityAddress}-.*.json`));
      const txLogFiles = zip.file(new RegExp(`txlogs-${account.addresses.identityAddress}-.*.json`));
      if (txoFiles.length > 0) {
        let count = 0;

        let maxHeight = 0;
        for (const txoFile of txoFiles) {
          const txoData = await txoFile.async('string');
          const txos: { block: { height: number } }[] = JSON.parse(txoData);
          for (const txo of txos) {
            if (txo.block && txo.block.height < 50000000) {
              maxHeight = Math.max(maxHeight, txo.block.height || 0);
            }
          }

          await spvWallet.restoreTxos(txos);
          progress({
            message: `Restored ${count + 1} of ${txoFiles.length} txo pages for ${account.addresses.identityAddress}...`,
            value: count,
            endValue: txoFiles.length,
          });
          count++;
        }
        await spvWallet?.stores?.txos?.storage.setState('lastSync', (maxHeight * 1e9).toString());
      }

      if (txLogFiles.length > 0) {
        let count = 0;
        for (const txLog of txLogFiles) {
          const txLogData = await txLog.async('string');
          const txLogs = JSON.parse(txLogData);
          await spvWallet.restoreTxLogs(txLogs);
          progress({
            message: `Restored ${count + 1} of ${txLogFiles.length} txlog pages for ${account.addresses.identityAddress}...`,
            value: count,
            endValue: txLogFiles.length,
          });
          count++;
        }
      }
      await spvWallet.destroy();
    }

    progress({ message: 'Txos restored successfully!' });
    await sleep(1000);
  };

  try {
    const zipContent = await zip.loadAsync(file);
    const chromeObject = await readChromeStorage(zipContent);
    if (chromeObject.version || 0 >= 3) {
      const accounts = Object.values(chromeObject.accounts);
      await restoreTxns(zipContent);
      await restoreTxos(zipContent, accounts);
    }
    await chromeStorageService.update(chromeObject);

    progress({ message: 'Accounts restored successfully!' });
    await sleep(1000);
    progress({ message: 'Master restore complete!' });
    await sleep(1000);
    await chromeStorageService.switchAccount(chromeObject.selectedAccount);
  } catch (error) {
    console.error('Failed to restore zip file', error);
    progress({ message: 'Failed to restore backup, see console for details.' });
  }
};
