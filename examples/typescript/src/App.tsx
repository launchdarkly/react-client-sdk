import { useLDClient } from 'launchdarkly-react-client-sdk';
import { useEffect, useState } from 'react';

const App = () => {
  const ldClient = useLDClient();
  const [userId, setUserId] = useState(0);

  const onClick = () => {
    setUserId((prev: number) => prev + 1);
  };

  useEffect(() => {
    if (!ldClient || userId === 0) {
      return;
    }
    const identifyUser = async () => {
      const context = { kind: 'user', key: `user-key-${userId}` };
      console.log('[LaunchDarkly] Identifying with context', JSON.stringify(context));
      await ldClient.identify(context);
      console.log(
        `[LaunchDarkly] For context: ${JSON.stringify(ldClient.getContext())}, flags: ${JSON.stringify(
          ldClient.allFlags(),
        )}`,
      );
    };

    identifyUser();
  }, [userId, ldClient]);

  return (
    <>
      User id: {userId}
      <div>
        <button onClick={onClick}>Change user</button>
      </div>
    </>
  );
};

export default App;
