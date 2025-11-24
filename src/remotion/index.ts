/**
 * src/remotion/index.ts
 * Remotion 注册入口
 */
import { registerRoot } from 'remotion';
import { RemotionRoot } from './Root';

// 注册根组件
// 注意：这里会报错找不到 './Root'，这是正常的，我们下一步就创建它。
registerRoot(RemotionRoot);