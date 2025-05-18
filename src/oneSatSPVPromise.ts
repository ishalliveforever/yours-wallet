import { ChromeStorageService } from './services/ChromeStorage.service';
import { initOneSatSPV } from './initSPVStore';

const chromeStorageService = new ChromeStorageService();
const oneSatSPVPromise = chromeStorageService.getAndSetStorage().then(() => initOneSatSPV(chromeStorageService, true));

export { oneSatSPVPromise };
