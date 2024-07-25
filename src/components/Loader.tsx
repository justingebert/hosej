import React from "react";
import { ClipLoader } from "react-spinners";

const Loader = ({ loading }: { loading: boolean }) => (
  <div className="flex items-center justify-center h-screen">
    <ClipLoader size={50} color={"#FFFFFF"} loading={loading} />
  </div>
);

export default Loader;