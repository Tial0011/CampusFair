export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAV */}
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-orange-500">CampusFair</h1>
        <input
          type="text"
          placeholder="Search for items..."
          className="hidden sm:block border border-gray-300 rounded-lg px-4 py-2 w-72 focus:outline-none"
        />
        <button className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg">
          Login
        </button>
      </nav>

      {/* HERO */}
      <div className="w-full">
        <img
          src="https://ng.jumia.is/cms/2024/WK06/Slider/Winter-sale-D.jpg"
          alt="Hero banner"
          className="w-full h-[250px] object-cover"
        />
      </div>

      {/* CATEGORY TITLE */}
      <div className="px-6 py-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          Top Deals For Students
        </h2>

        {/* PRODUCT GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6 mt-6">
          {/* PRODUCT 1 */}
          <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-3 cursor-pointer">
            <img
              src="https://ng.jumia.is/unsafe/fit-in/300x300/filters:fill(white)/product/27/1819501/1.jpg?0521"
              className="w-full h-48 object-contain"
              alt=""
            />
            <p className="font-medium mt-2 text-gray-800">
              HP EliteBook 840 G3
            </p>
            <p className="text-orange-500 font-bold text-lg mt-1">₦95,000</p>
          </div>

          {/* PRODUCT 2 */}
          <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-3 cursor-pointer">
            <img
              src="https://ng.jumia.is/unsafe/fit-in/300x300/filters:fill(white)/product/63/545138/1.jpg?2652"
              className="w-full h-48 object-contain"
              alt=""
            />
            <p className="font-medium mt-2 text-gray-800">Tecno Spark 10</p>
            <p className="text-orange-500 font-bold text-lg mt-1">₦120,000</p>
          </div>

          {/* PRODUCT 3 */}
          <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-3 cursor-pointer">
            <img
              src="https://ng.jumia.is/unsafe/fit-in/300x300/filters:fill(white)/product/70/065425/1.jpg?6044"
              className="w-full h-48 object-contain"
              alt=""
            />
            <p className="font-medium mt-2 text-gray-800">AirPods Pro</p>
            <p className="text-orange-500 font-bold text-lg mt-1">₦25,000</p>
          </div>

          {/* PRODUCT 4 */}
          <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-3 cursor-pointer">
            <img
              src="https://ng.jumia.is/unsafe/fit-in/300x300/filters:fill(white)/product/20/0708811/1.jpg?2005"
              className="w-full h-48 object-contain"
              alt=""
            />
            <p className="font-medium mt-2 text-gray-800">
              Samsung 64GB SD Card
            </p>
            <p className="text-orange-500 font-bold text-lg mt-1">₦4,000</p>
          </div>

          {/* PRODUCT 5 */}
          <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-3 cursor-pointer">
            <img
              src="https://ng.jumia.is/unsafe/fit-in/300x300/filters:fill(white)/product/79/0663351/1.jpg?8494"
              className="w-full h-48 object-contain"
              alt=""
            />
            <p className="font-medium mt-2 text-gray-800">
              Female Hostel Slides
            </p>
            <p className="text-orange-500 font-bold text-lg mt-1">₦1,500</p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="text-center py-6 text-gray-600 text-sm border-t mt-6">
        © {new Date().getFullYear()} CampusFair. Built for Students.
      </footer>
    </div>
  );
}
