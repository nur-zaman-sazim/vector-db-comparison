import dayjs from "dayjs";

import { addMonthToDate } from "../datetime";

describe("datetime", () => {
  describe("addMonthToDate", () => {
    it("should be able to pass a Date object", () => {
      const currentDate = new Date("2021-01-01");
      const oneMonthLater = addMonthToDate(currentDate);
      expect(oneMonthLater.format("YYYY-MM-DD")).toBe("2021-02-01");
    });

    it("should be able to pass a Dayjs object", () => {
      const currentDate = dayjs("2021-01-01");
      const oneMonthLater = addMonthToDate(currentDate);
      expect(oneMonthLater.format("YYYY-MM-DD")).toBe("2021-02-01");
    });

    it.each([
      [{ currentDate: dayjs("2021-01-01").toDate(), expectedDate: "2021-02-01" }],
      [{ currentDate: dayjs("2021-01-31").toDate(), expectedDate: "2021-02-28" }],
      [{ currentDate: dayjs("2021-02-28").toDate(), expectedDate: "2021-03-31" }],
      [{ currentDate: dayjs("2021-04-30").toDate(), expectedDate: "2021-05-31" }],
      [{ currentDate: dayjs("2021-12-31").toDate(), expectedDate: "2022-01-31" }],
      [{ currentDate: dayjs("2021-04-14").toDate(), expectedDate: "2021-05-14" }],
      [{ currentDate: dayjs("2021-11-17").toDate(), expectedDate: "2021-12-17" }],
      [{ currentDate: dayjs("2021-11-01").endOf("day").toDate(), expectedDate: "2021-12-01" }],
    ])(
      "should add one month to the current date: $currentDate",
      ({ currentDate, expectedDate }) => {
        const oneMonthLater = addMonthToDate(currentDate);
        expect(oneMonthLater.format("YYYY-MM-DD")).toBe(expectedDate);
      },
    );

    it.each([
      [{ currentDate: dayjs("2021-01-01").toDate(), numMonths: 2, expectedDate: "2021-03-01" }],
      [{ currentDate: dayjs("2021-01-31").toDate(), numMonths: 3, expectedDate: "2021-04-30" }],
      [{ currentDate: dayjs("2021-02-28").toDate(), numMonths: 5, expectedDate: "2021-07-31" }],
      [{ currentDate: dayjs("2021-04-30").toDate(), numMonths: 8, expectedDate: "2021-12-31" }],
      [{ currentDate: dayjs("2021-12-31").toDate(), numMonths: 9, expectedDate: "2022-09-30" }],
      [{ currentDate: dayjs("2021-04-14").toDate(), numMonths: 2, expectedDate: "2021-06-14" }],
      [{ currentDate: dayjs("2021-11-01").toDate(), numMonths: 3, expectedDate: "2022-02-01" }],
      [
        {
          currentDate: dayjs("2021-11-17").endOf("day").toDate(),
          numMonths: 3,
          expectedDate: "2022-02-17",
        },
      ],
    ])(
      "should add $numMonths months to the current date: $currentDate",
      ({ currentDate, numMonths, expectedDate }) => {
        const oneMonthLater = addMonthToDate(currentDate, numMonths);
        expect(oneMonthLater.format("YYYY-MM-DD")).toBe(expectedDate);
      },
    );
  });
});
