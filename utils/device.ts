export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('newsflow_device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('newsflow_device_id', deviceId);
  }
  return deviceId;
};

export const getDeviceName = (): string => {
  const ua = navigator.userAgent;
  let browser = "Unknown Browser";
  let os = "Unknown OS";

  if (ua.indexOf("Firefox") > -1) browser = "Firefox";
  else if (ua.indexOf("Chrome") > -1) browser = "Chrome";
  else if (ua.indexOf("Safari") > -1) browser = "Safari";

  if (ua.indexOf("Win") > -1) os = "Windows";
  else if (ua.indexOf("Mac") > -1) os = "MacOS";
  else if (ua.indexOf("Linux") > -1) os = "Linux";
  else if (ua.indexOf("Android") > -1) os = "Android";
  else if (ua.indexOf("like Mac") > -1) os = "iOS";

  return `${browser} on ${os}`;
};