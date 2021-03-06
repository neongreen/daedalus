// @flow
import ClientApi from 'daedalus-client-api';
import { action } from 'mobx';
import Wallet from '../domain/Wallet';
import WalletTransaction from '../domain/WalletTransaction';
import type {
  createWalletRequest,
  getTransactionsRequest,
  createTransactionRequest,
  walletRestoreRequest
} from './index';
import { user } from './fixtures';
import User from '../domain/User';
import Profile from '../domain/Profile';
import { WalletAlreadyRestoredError } from './errors';

const notYetImplemented = () => new Promise((resolve, reject) => reject(new Error('Api method not yet implemented')));

export default class CardanoClientApi {

  login() {
    // TODO: Implement when backend is ready for it
    return new Promise((resolve) => resolve(true));
  }

  getUser() {
    return new Promise((resolve) => {
      setTimeout(action(() => {
        resolve(new User(user.id, new Profile(user.profile)));
      }), 0);
    });
  }

  async getWallets() {
    const response = await ClientApi.getWallets();
    return response.map(data => this._createWalletFromData(data));
  }

  async getTransactions({ walletId, searchTerm, skip, limit }: getTransactionsRequest) {
    const history = await ClientApi.searchHistory(walletId, searchTerm, skip, limit);
    return new Promise((resolve) => resolve({
      transactions: history[0].map(data => this._createTransactionFromData(data, walletId)),
      total: history[1]
    }));
  }

  createUser() {
    return notYetImplemented();
  }

  async createWallet(request: createWalletRequest) {
    const response = await ClientApi.newWallet('CWTPersonal', 'ADA', request.name, request.mnemonic);
    return this._createWalletFromData(response);
  }

  async createTransaction(request: createTransactionRequest) {
    const { sender, receiver, amount, currency, title } = request;
    let { description } = request;
    if (!description) description = 'no description provided';
    const response = await ClientApi.sendExtended(sender, receiver, amount, currency, title, description);
    return this._createTransactionFromData(response);
  }

  isValidAddress(currency: string, address: string) {
    return ClientApi.isValidAddress(currency, address);
  }

  updateProfileField() {
    return notYetImplemented();
  }

  @action _createWalletFromData(data) {
    return new Wallet({
      id: data.cwAddress,
      address: data.cwAddress,
      amount: data.cwAmount.getCoin,
      type: data.cwMeta.cwType,
      currency: data.cwMeta.cwCurrency,
      name: data.cwMeta.cwName,
    });
  }

  @action _createTransactionFromData(data) {
    const isOutgoing = data.ctType.tag === 'CTOut';
    const coins = data.ctAmount.getCoin;
    let { ctmTitle, ctmDescription, ctmDate } = data.ctType.contents;
    if (!ctmTitle) ctmTitle = 'Incoming Money';
    return new WalletTransaction({
      id: data.ctId,
      title: ctmTitle,
      type: isOutgoing ? 'adaExpend' : 'adaIncome',
      currency: 'ada',
      amount: isOutgoing ? -1 * coins : coins,
      date: new Date(ctmDate * 1000),
      description: ctmDescription,
    });
  }

  getWalletRecoveryPhrase() {
    return new Promise((resolve) => resolve(ClientApi.generateMnemonic().split(' ')));
  }

  async restoreWallet({ recoveryPhrase, walletName }: walletRestoreRequest) {
    try {
      return await ClientApi.restoreWallet('CWTPersonal', 'ADA', walletName, recoveryPhrase);
    } catch (error) {
      if (error.message.includes('Wallet with that mnemonics already exists')) {
        throw new WalletAlreadyRestoredError(error.message);
      }
      throw error;
    }
  }
}
