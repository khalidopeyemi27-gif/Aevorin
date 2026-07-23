import { db } from "../database/db";
import type { DeviceIdentity } from "../database/schema";

export class DeviceIdentityManager {
  private static cachedDeviceId: string | null = null;

  public static async getDeviceId(): Promise<string> {
    if (this.cachedDeviceId) return this.cachedDeviceId;

    try {
      const existing = await db.deviceIdentity.toCollection().first();
      if (existing) {
        this.cachedDeviceId = existing.deviceId;
        await db.deviceIdentity.update(existing.deviceId, { lastSeen: Date.now() });
        return existing.deviceId;
      }

      const newId = `device_web_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newIdentity: DeviceIdentity = {
        deviceId: newId,
        platform: "WEB",
        createdAt: Date.now(),
        lastSeen: Date.now(),
        appVersion: "2.0.0"
      };

      await db.deviceIdentity.put(newIdentity);
      this.cachedDeviceId = newId;
      return newId;
    } catch (e) {
      console.error("[DeviceIdentity] Error fetching device identity, using fallback:", e);
      return `device_web_fallback_${Date.now()}`;
    }
  }
}
