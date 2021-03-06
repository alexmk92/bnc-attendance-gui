import { LoaderFunction } from "@remix-run/server-runtime";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "remix";
import { getMains } from "~/models/roster.server";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { useEffect, useMemo, useState } from "react";

type LoaderData = {
  mains: Awaited<ReturnType<typeof getMains>>;
};
type HighchartsData = {
  title: { text: string };
  chart?: { type: string; width: number; height: number };
  xAxis: { categories: string[]; crosshair: boolean };
  series: { name: string; data: number[] }[];
};
// import { useOptionalUser } from "~/utils";
export const loader: LoaderFunction = async () => {
  const mains = await getMains();
  return json<LoaderData>({ mains });
};

export default function IndexRoute() {
  const { mains } = useLoaderData<LoaderData>();
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  } | null>({ key: "name", direction: "ascending" });
  const [sortedMainData, setSortedMainData] =
    useState<Awaited<ReturnType<typeof getMains>>>(mains);
  const [options, setOptions] = useState<HighchartsData>({
    title: { text: "Attendance" },
    xAxis: { categories: [], crosshair: true },
    series: [],
  });

  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig?.key === key && sortConfig?.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  useMemo(() => {
    let sortedMains = [...mains];
    if (sortConfig?.key && sortConfig?.direction) {
      sortedMains.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    setSortedMainData(sortedMains);
  }, [mains, sortConfig]);

  useEffect(() => {
    const filteredMains = mains.filter((main) => main.attendance_life ?? 0 > 0);

    const attendance: { [key: string]: { name: string; data: number[] } } = {
      attendance_30: { name: "attendance_30", data: [] },
      attendance_60: { name: "attendance_60", data: [] },
      attendance_90: { name: "attendance_90", data: [] },
      attendance_life: { name: "attendance_life", data: [] },
    };
    const categories: string[] = [];

    filteredMains.forEach((main) => {
      if (main.attendance_60 > 0) {
        categories.push(main.name);
        attendance.attendance_30.data.push(main.attendance_30 ?? 0);
        attendance.attendance_60.data.push(main.attendance_60 ?? 0);
        attendance.attendance_90.data.push(main.attendance_90 ?? 0);
        attendance.attendance_life.data.push(main.attendance_life ?? 0);
      }
    });

    const xAxis: { categories: string[]; crosshair: boolean } = {
      categories,
      crosshair: true,
    };

    setOptions({
      ...options,
      // Only show members > 60 day attendance
      series: Object.values(attendance),
      xAxis,
    });
  }, [mains]);

  const renderSortIndicator = (col: string) => {
    if (sortConfig?.key === col) {
      return sortConfig.direction === "ascending" ? " ???" : " ???";
    }
  };

  return (
    <main className="relative flex min-h-screen flex-grow flex-col items-center justify-center bg-white">
      <div style={{ alignSelf: "flex-start" }}>
        <nav className="hidden sm:flex" aria-label="Breadcrumb">
          <ol role="list" className="flex items-center space-x-4">
            <li>
              <div className="flex">
                <Link
                  to="/"
                  className="text-sm font-medium text-blue-500 hover:text-gray-700"
                >
                  Dashboard
                </Link>
              </div>
            </li>
          </ol>
        </nav>
      </div>
      <div id="chart-container" className="w-full" style={{ height: "700px" }}>
        <HighchartsReact
          highcharts={Highcharts}
          options={{
            ...options,
            chart: {
              type: "column",
              height: 700,
            },
          }}
        />
      </div>
      <table className="mt-4 min-w-full py-4 px-12">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
            >
              <button
                className="text-sm font-semibold text-gray-900"
                type="button"
                onClick={() => requestSort("name")}
              >
                Name{renderSortIndicator("name")}
              </button>
            </th>
            <th
              scope="col"
              className="hidden px-3 py-3.5 text-right text-sm font-semibold text-gray-900 lg:table-cell"
            >
              <button
                className="text-sm font-semibold text-gray-900"
                type="button"
                onClick={() => requestSort("attendance_30")}
              >
                Attendance 30 days{renderSortIndicator("attendance_30")}
              </button>
            </th>
            <th
              scope="col"
              className="hidden px-3 py-3.5 text-right text-sm font-semibold text-gray-900 sm:table-cell"
            >
              <button
                className="text-sm font-semibold text-gray-900"
                type="button"
                onClick={() => requestSort("attendance_60")}
              >
                Attendance 60 days{renderSortIndicator("attendance_60")}
              </button>
            </th>
            <th
              scope="col"
              className="hidden px-3 py-3.5 text-right text-sm font-semibold text-gray-900 sm:table-cell"
            >
              <button
                className="text-sm font-semibold text-gray-900"
                type="button"
                onClick={() => requestSort("attendance_90")}
              >
                Attendance 90 days{renderSortIndicator("attendance_90")}
              </button>
            </th>
            <th
              scope="col"
              className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
            >
              <button
                className="h-full text-sm font-semibold text-gray-900"
                type="button"
                onClick={() => requestSort("attendance_life")}
              >
                Attendance life{renderSortIndicator("attendance_life")}
              </button>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {sortedMainData.map((main) => (
            <tr key={main.name}>
              <td className="whitespace-nowrap px-3 py-4 text-sm capitalize text-gray-500">
                <img
                  className="mr-2 inline-block h-6 w-6 rounded-full"
                  src={`/images/${main.class}.png`}
                />
                <Link className="text-blue-500" to={`/players/${main.id}`}>
                  {main.name}
                </Link>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">
                {main.attendance_30 ?? 0}%
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">
                {main.attendance_60 ?? 0}%
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">
                {main.attendance_90 ?? 0}%
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">
                {main.attendance_life ?? 0}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
