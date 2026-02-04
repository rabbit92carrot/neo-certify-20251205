/**
 * CERT_COMPLETE 템플릿 실제 등록 스크립트
 * 실행: npx tsx scripts/register-template.ts
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

// .env.local 수동 로드
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) {continue;}
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) {continue;}
  const key = trimmed.slice(0, eqIdx);
  const value = trimmed.slice(eqIdx + 1);
  process.env[key] = value;
}

// 테스트 모드 해제 (실제 API 호출)
process.env.ALIGO_TEST_MODE = '';

import { registerTemplate } from '@/services/alimtalk.service';
import { ALIMTALK_TEMPLATES } from '@/constants/alimtalk-templates';
import type { AligoButton } from '@/services/alimtalk.service';

async function main() {
  const tpl = ALIMTALK_TEMPLATES['CERT_COMPLETE'];
  if (!tpl) {
    console.error('CERT_COMPLETE 템플릿을 찾을 수 없습니다.');
    process.exit(1);
  }

  const buttons: AligoButton[] = tpl.buttons
    .filter((b) => b.type === 'WL')
    .map((b) => ({
      name: b.name,
      linkType: b.type as AligoButton['linkType'],
      linkM: b.urlTemplate ? `https://neo-certify.com${b.urlTemplate}` : undefined,
      linkP: b.urlTemplate ? `https://neo-certify.com${b.urlTemplate}` : undefined,
    }));

  console.log('=== CERT_COMPLETE 실제 템플릿 등록 ===');
  console.log('tpl_button:', JSON.stringify({ button: buttons }));
  console.log('');

  const result = await registerTemplate({
    tplCode: tpl.code,
    tplName: tpl.name,
    tplContent: tpl.content,
    messageType: tpl.messageType,
    emphasizeType: tpl.emphasizeType as 'NONE' | 'TEXT' | 'IMAGE',
    tplEmTitle: tpl.emphasizeTitle,
    tplEmSubtitle: tpl.emphasizeSubtitle,
    tplButton: buttons,
  });

  console.log('등록 결과:', JSON.stringify(result, null, 2));
}

main().catch(console.error);
