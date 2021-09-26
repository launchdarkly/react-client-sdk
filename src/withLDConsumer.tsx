import * as React from 'react';
import { Consumer, LDContext } from './context';
import { LDClient, LDFlagSet } from 'launchdarkly-js-client-sdk';

/**
 * Controls the props the wrapped component receives from the `LDConsumer` HOC.
 */
export interface ConsumerOptions {
  /**
   * If true then the wrapped component only receives the `ldClient` instance
   * and nothing else.
   */
  clientOnly: boolean;
}

/**
 * The possible props the wrapped component can receive from the `LDConsumer` HOC.
 */
export interface LDProps {
  /**
   * A map of feature flags from their keys to their values.
   * Keys are camelCased using `lodash.camelcase`.
   */
  flags?: LDFlagSet;

  /**
   * An instance of `LDClient` from the LaunchDarkly JS SDK (`launchdarkly-js-client-sdk`)
   *
   * @see https://docs.launchdarkly.com/sdk/client-side/javascript
   */
  ldClient?: LDClient;
}

/**
 * withLDConsumer is a function which accepts an optional options object and returns a function
 * which accepts your React component. This function returns a HOC with flags
 * and the ldClient instance injected via props.
 *
 * @param options - If you need only the `ldClient` instance and not flags, then set `{ clientOnly: true }`
 * to only pass the ldClient prop to your component. Defaults to `{ clientOnly: false }`.
 * @return A HOC with flags and the `ldClient` instance injected via props
 */
function withLDConsumer(options: ConsumerOptions = { clientOnly: false }) {
  return function withLDConsumerHoc<P>(WrappedComponent: React.ComponentType<P & LDProps>) {
    return (props: P) => (
      <Consumer>
        {({ flags, ldClient }: LDContext) => {
          if (options.clientOnly) {
            return <WrappedComponent ldClient={ldClient} {...props} />;
          }

          return <WrappedComponent flags={flags} ldClient={ldClient} {...props} />;
        }}
      </Consumer>
    );
  };
}

export default withLDConsumer;
