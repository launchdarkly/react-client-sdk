import useLDClient from './useLDClient';
import { useEffect } from 'react';

type useContextUpdatesProps = {
  uuid: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  kind?: string;
};

function useContextUpdates(args: useContextUpdatesProps) {
  const client = useLDClient();
  const { uuid, first_name, last_name, email, kind } = args;

  useEffect(() => {
    if (uuid) {
      client?.identify({
        kind: kind ?? 'user',
        key: uuid,
        name: `${first_name ?? ''} ${last_name ?? ''}`,
        email,
      });
    }
  }, [client, email, first_name, last_name, uuid]);
}

export default useContextUpdates;
