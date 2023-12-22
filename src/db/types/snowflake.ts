import { customType } from "drizzle-orm/mysql-core";

export const snowflake = customType<{ data: string; driverData: bigint; }>({
  fromDriver(value) {
    return value.toString()
  },
  toDriver(value) {
    try {
      return BigInt(value);
    } catch {
      throw new Error('snowflakes must be valid bigints...');
    }
  },
  dataType() {
    return 'bigint';
  }
})