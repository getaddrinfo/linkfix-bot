import { customType } from "drizzle-orm/mysql-core";

type FlagMap<T extends string> = Record<T, boolean>;
type FlagBits<T extends string> = Record<T, number>;

export const flags = <T extends string>(field: string, options: (T | null)[]) => {
  const bits = {} as FlagBits<T>;
  let i = 1;

  options.forEach((flag) => {
    if (flag === null) {
      i <<= 1;
      return;
    }

    bits[flag] = i;
    i <<= 1;
  });
  
  return customType<{ data: FlagMap<T>, driverData: number }>({
    dataType() {
      return 'int'
    },
    fromDriver(value) {
      const out = {} as FlagMap<T>;

      for(const [name, bit] of Object.entries(bits)) {
        out[name as T] = ((value & (bit as number)) === bit);
      }

      return out;
    },
    toDriver(value) {
      let out = 0;

      for(const [name, isSet] of Object.entries(value)) {
        if (isSet) {
          out |= bits[name as T];
        }
      }

      return out;
    }
  })(field);
}