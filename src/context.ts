import { createContext } from 'react';
import { ReactSdkContext } from './types';

/**
 * `reactSdkContextFactory` is a function useful for creating a React context for use with
 * all the providers and consumers in this library.
 *
 * @return a React Context
 */
const reactSdkContextFactory = () => createContext<ReactSdkContext>({ flags: {}, flagKeyMap: {}, ldClient: undefined });
/**
 * @ignore
 */
const context = reactSdkContextFactory();
const {
  /**
   * @ignore
   */
  Provider,
  /**
   * @ignore
   */
  Consumer,
} = context;

export { Provider, Consumer, ReactSdkContext, reactSdkContextFactory };
export default context;
