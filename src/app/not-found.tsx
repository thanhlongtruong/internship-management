import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-fit mx-auto text-center">
      <h1 className="text-6xl font-bold">{"(>_<)"}</h1>
      <p className="mt-4 text-xl text-gray-600">
        Sorry, this page does not exist.
      </p>
      <Link
        href="/"
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500">
        Trở về
      </Link>
    </div>
  );
}
