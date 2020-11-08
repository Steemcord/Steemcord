import { notarize } from 'electron-notarize';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function notarizing(context): Promise<void> {
  const { electronPlatformName, appOutDir } = context;  
  if (electronPlatformName !== 'darwin') return;

  const appName = context.packager.appInfo.productFilename;

  return await notarize({
    appBundleId: 'com.snazzah.steemcord',
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_PASSWORD,
  });
}