import { describe, expect, it } from "vitest"

import { averageFinalScore, computeWeightedTotal } from "./scoring"

describe("computeWeightedTotal", () => {
  it("returns 100 when every criterion is a perfect 10", () => {
    expect(
      computeWeightedTotal({
        theme: 10,
        design: 10,
        functionality: 10,
        creativity: 10,
        aiUsage: 10,
      }),
    ).toBe(100)
  })

  it("returns 0 when every criterion is 0", () => {
    expect(
      computeWeightedTotal({
        theme: 0,
        design: 0,
        functionality: 0,
        creativity: 0,
        aiUsage: 0,
      }),
    ).toBe(0)
  })

  it("weights each criterion per docs/02", () => {
    // theme=8 -> 20, design=6 -> 15, functionality=10 -> 25, creativity=4 -> 6, aiUsage=5 -> 5
    expect(
      computeWeightedTotal({
        theme: 8,
        design: 6,
        functionality: 10,
        creativity: 4,
        aiUsage: 5,
      }),
    ).toBe(71)
  })
})

describe("averageFinalScore", () => {
  it("returns null with no final scores", () => {
    expect(averageFinalScore([])).toBeNull()
  })

  it("averages multiple judges' totals", () => {
    expect(averageFinalScore([80, 90])).toBe(85)
  })

  it("rounds to 2 decimals", () => {
    expect(averageFinalScore([70, 71, 72])).toBe(71)
    expect(averageFinalScore([70, 70, 71])).toBeCloseTo(70.33, 2)
  })
})
