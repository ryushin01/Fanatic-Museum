import { useId } from 'react';
import {
  Button,
  Input,
  Label,
  Radio,
  RadioGroup,
  SearchField,
  ToggleButton,
  ToggleButtonGroup,
} from 'react-aria-components';

import type { Category, CategorySlug } from '@/shared/api';

import { WORK_SORTS, type WorkFilter as WorkFilterValue, type WorkSort } from '../model/filter';
import styles from './work-filter.module.css';

export interface WorkFilterProps {
  value: WorkFilterValue;
  onChange: (value: WorkFilterValue) => void;
  categories: readonly Category[];
  resultCount: number;
  total: number;
}

const SORT_LABELS: Record<WorkSort, string> = {
  number: '번호순',
  year: '처음 나온 해',
  title: '가나다순',
};

/** 소장품 검색어 입력, 분류 선택(여러 개), 정렬(하나). */
export function WorkFilter({ value, onChange, categories, resultCount, total }: WorkFilterProps) {
  const groupLabelId = useId();
  const filtered = value.query !== '' || value.categories.length > 0;

  return (
    <search className={styles.filter}>
      <SearchField
        className={styles.search}
        value={value.query}
        onChange={(query) => onChange({ ...value, query })}
      >
        <Label className={styles.searchLabel}>소장품 찾기</Label>
        <div className={styles.inputWrap}>
          <Input className={styles.input} placeholder="제목, 원제, 작가 이름, 초성" />
          <Button className={styles.clear}>
            <span aria-hidden="true">✕</span>
            <span className="visually-hidden">검색어 지우기</span>
          </Button>
        </div>
      </SearchField>

      <div>
        <p id={groupLabelId} className={styles.groupLabel}>
          분류 <span className="visually-hidden">(여러 개 고를 수 있습니다)</span>
        </p>
        <ToggleButtonGroup
          aria-labelledby={groupLabelId}
          className={styles.toggles}
          selectionMode="multiple"
          selectedKeys={value.categories}
          onSelectionChange={(keys) =>
            onChange({
              ...value,
              categories: categories
                .map((c) => c.slug)
                .filter((slug) => keys.has(slug)) as CategorySlug[],
            })
          }
        >
          {categories.map((category) => (
            <ToggleButton key={category.slug} id={category.slug} className={styles.toggle}>
              {category.name}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>

      {/* 정렬은 하나만 고르는 라디오: 화살표 키로 바로 고르고, Tab으로는 고른 항목 하나에만 머뭅니다 */}
      <RadioGroup
        className={styles.sort}
        orientation="horizontal"
        value={value.sort}
        onChange={(next) => {
          const sort = WORK_SORTS.find((key) => key === next);
          if (sort) onChange({ ...value, sort });
        }}
      >
        <Label className={styles.groupLabel}>정렬</Label>
        <div className={styles.toggles}>
          {WORK_SORTS.map((sort) => (
            <Radio key={sort} value={sort} className={`${styles.toggle} ${styles.radio}`}>
              {SORT_LABELS[sort]}
            </Radio>
          ))}
        </div>
      </RadioGroup>

      <p className={styles.count} role="status">
        {filtered ? `${total}점 가운데 ${resultCount}점을 찾았습니다.` : `소장품 ${total}점`}
      </p>
      {filtered && (
        <Button
          className={styles.reset}
          onPress={() => onChange({ ...value, query: '', categories: [] })}
        >
          조건 모두 지우기
        </Button>
      )}
    </search>
  );
}
