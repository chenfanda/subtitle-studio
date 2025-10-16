/**
 * Store 通用工具函数
 * 用于简化 Store 中的常见操作模式
 */

/**
 * 通过 ID 查找项
 * @param items 项数组
 * @param id 要查找的 ID
 * @returns 找到的项或 undefined
 */
export const findById = <T extends { id: string }>(
  items: T[],
  id: string
): T | undefined => {
  return items.find(item => item.id === id);
};

/**
 * 通过 ID 更新项
 * @param items 项数组
 * @param id 要更新的项 ID
 * @param updates 要更新的字段
 * @returns 是否更新成功
 */
export const updateById = <T extends { id: string }>(
  items: T[],
  id: string,
  updates: Partial<T>
): boolean => {
  const item = findById(items, id);
  if (item) {
    Object.assign(item, updates);
    return true;
  }
  return false;
};

/**
 * 按开始时间排序
 * @param items 包含 startTime 的项数组
 * @returns 排序后的新数组
 */
export const sortByTime = <T extends { startTime: number }>(
  items: T[]
): T[] => {
  return [...items].sort((a, b) => a.startTime - b.startTime);
};

/**
 * 查找插入位置（保持时间顺序）
 * @param items 已排序的项数组
 * @param startTime 要插入项的开始时间
 * @returns 插入位置索引，-1 表示插入末尾
 */
export const findInsertIndex = <T extends { startTime: number }>(
  items: T[],
  startTime: number
): number => {
  const index = items.findIndex(item => item.startTime > startTime);
  return index;
};

/**
 * 生成唯一 ID
 * 格式：时间戳-随机字符串
 * @returns 唯一 ID 字符串
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 深拷贝对象（用于快照）
 * @param obj 要拷贝的对象
 * @returns 深拷贝后的对象
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * 查找指定时间的项
 * @param items 项数组
 * @param time 时间（毫秒）
 * @returns 找到的项或 null
 */
export const findItemAtTime = <T extends { startTime: number; endTime: number }>(
  items: T[],
  time: number
): T | null => {
  return items.find(item => time >= item.startTime && time <= item.endTime) || null;
};

/**
 * 获取时间范围内的所有项
 * @param items 项数组
 * @param startTime 开始时间（毫秒）
 * @param endTime 结束时间（毫秒）
 * @returns 符合条件的项数组
 */
export const findItemsInRange = <T extends { startTime: number; endTime: number }>(
  items: T[],
  startTime: number,
  endTime: number
): T[] => {
  return items.filter(item => 
    !(item.endTime < startTime || item.startTime > endTime)
  );
};

/**
 * 检查时间范围是否重叠
 * @param item1 第一个项
 * @param item2 第二个项
 * @returns 是否重叠
 */
export const isTimeOverlap = <T extends { startTime: number; endTime: number }>(
  item1: T,
  item2: T
): boolean => {
  return !(item1.endTime <= item2.startTime || item1.startTime >= item2.endTime);
};

/**
 * 批量删除项
 * @param items 项数组
 * @param ids 要删除的 ID 数组
 * @returns 删除后的新数组
 */
export const removeByIds = <T extends { id: string }>(
  items: T[],
  ids: string[]
): T[] => {
  const idSet = new Set(ids);
  return items.filter(item => !idSet.has(item.id));
};