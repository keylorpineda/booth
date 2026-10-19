import { useState } from 'react';

/** `on`: system notifications allowed and wanted. `blocked`: the browser denied them. */
export type AlertsSetting = 'unsupported' | 'blocked' | 'on' | 'off';

const STORAGE_KEY = 'booth.alerts';

function readSetting(): AlertsSetting {
  if (typeof Notification === 'undefined') return 'unsupported';
  if (Notification.permission === 'denied') return 'blocked';
  let wanted: string | null = null;
  try {
    wanted = localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private mode: treat as not chosen.
  }
  return Notification.permission === 'granted' && wanted !== 'off' ? 'on' : 'off';
}

function save(value: 'on' | 'off') {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // The choice lasts for this page only.
  }
}

/** System notifications for this device: asks the browser the first time they are turned on. */
export function useAlertsSetting(): [AlertsSetting, () => Promise<void>] {
  const [setting, setSetting] = useState(readSetting);

  const toggle = async () => {
    if (setting === 'on') {
      save('off');
      setSetting('off');
      return;
    }
    if (setting !== 'off') return;
    const permission = await Notification.requestPermission();
    if (permission === 'granted') save('on');
    setSetting(readSetting());
  };

  return [setting, toggle];
}
