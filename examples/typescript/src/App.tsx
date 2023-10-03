import { useLDClient } from 'launchdarkly-react-client-sdk';
import React, { FunctionComponent, useEffect, useState } from 'react';

const App: FunctionComponent = () => {
  const ldClient = useLDClient();
  const [userIdNumber, setUserIdNumber] = useState(0);

  const onClick = () => {
    setUserIdNumber((prev: number) => prev + 1);
  };

  useEffect(() => {
    if (!ldClient || userIdNumber === 0) {
      return;
    }
    const identifyUser = async () => {
      const context = { kind: 'user', key: `${userIdNumber}` };
      console.log('[LaunchDarkly] Identifying with context', JSON.stringify(context));
      await ldClient.identify(context);
      console.log(
        `[LaunchDarkly] For context: ${JSON.stringify(ldClient.getContext())}, flags: ${JSON.stringify(
          ldClient.allFlags(),
        )}`,
      );
    };

    identifyUser();
  }, [userIdNumber, ldClient]);

  return (
    <>
      User id: {userIdNumber}
      <div>
        <button onClick={onClick}>Change user</button>
      </div>
    </>
  );
};

export default App;
