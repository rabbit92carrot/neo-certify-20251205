/**
 * UI 유틸리티 - Tailwind CSS 클래스 병합
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind CSS 클래스 병합 유틸리티
 * clsx와 tailwind-merge를 조합하여 조건부 클래스와 중복 클래스를 처리
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
