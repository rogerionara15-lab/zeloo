import type { VercelRequest, VercelResponse } from '@vercel/node';
import extraHandler from './extra';

export default function handler(req: VercelRequest, res: VercelResponse) {
  return extraHandler(req, res);
}
