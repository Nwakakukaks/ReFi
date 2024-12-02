import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { useEffect, useState, useContext } from "react";
import { CustomConnectButton } from "./ConnectButton";

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleHome = () => {
    navigate("/");
  };

  const handleLogin = () => {
    navigate("/dashboard");
  };

  const isPaymentOrClaimOrAccess =
    location.pathname === "/payment" || location.pathname === "/claim" || location.pathname === "/access";
  return (
    <>
      {isPaymentOrClaimOrAccess ? (
        <div></div>
      ) : (
        <>
          <div className="w-full bg-white py-1 px-10">
            <p className="text-xs text-center text-black">
              We appreciate you exploring our beta! Your feedback helps us grow and improve.
            </p>
          </div>
          <div className="flex items-center justify-between px-4 py-2 max-w-screen-xl mx-auto w-full flex-wrap lg:px-20 mt-1">
            <h3 onClick={handleHome} className="text-xl font-bold cursor-pointer">
              NearPay
            </h3>

            {location.pathname === "/" && (
              <div className="flex items-center space-x-6 text-sm font-medium mt-1">
                {/* <p className="cursor-pointer">Company</p>
                <p className="cursor-pointer">Product</p>
                <p className="cursor-pointer">Contact us</p> */}
              </div>
            )}

            <div className="flex items-center space-x-4">
              {location.pathname === "/" ? (
                <Button onClick={handleLogin} className="bg-[#5DEB5A] rounded-full py-3 px-8 hover:bg-[#5DEB5A]">
                  Login
                </Button>
              ) : (
                <CustomConnectButton />
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
