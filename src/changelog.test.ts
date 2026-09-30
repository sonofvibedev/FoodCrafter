import { describe, expect, it } from 'vitest'
import { APP_VERSION, CHANGELOG, bumpVersion } from './changelog'

describe('нумерация версий', () => {
  it('глобальное изменение поднимает вторую цифру', () => {
    expect(bumpVersion('1.0.0', 'global')).toBe('1.1')
    expect(bumpVersion('1.1.2.0007', 'global')).toBe('1.2')
  })

  it('важное изменение поднимает третью цифру', () => {
    expect(bumpVersion('1.1', 'important')).toBe('1.1.1')
    expect(bumpVersion('1.1.1', 'important')).toBe('1.1.2')
  })

  it('локальные правки считаются пачкой из четырёх цифр', () => {
    expect(bumpVersion('1.1.1', 'local', 3)).toBe('1.1.1.0003')
    expect(bumpVersion('1.1.1.0003', 'local', 2)).toBe('1.1.1.0005')
    expect(bumpVersion('1.1.1', 'local')).toBe('1.1.1.0001')
  })
})

describe('список изменений', () => {
  it('APP_VERSION совпадает с верхней записью', () => {
    expect(CHANGELOG[0].version).toBe(APP_VERSION)
  })

  it('каждая запись описывает хотя бы одно изменение', () => {
    for (const release of CHANGELOG) {
      const all = Object.values(release.changes).flat()
      expect(all.length).toBeGreaterThan(0)
    }
  })
})
