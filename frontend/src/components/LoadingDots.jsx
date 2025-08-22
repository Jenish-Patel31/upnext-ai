import React from "react";
import { motion } from "framer-motion";

const LoadingDots = ({ color = "purple" }) => {
  const colors = {
    purple: "bg-purple-500",
    indigo: "bg-indigo-500",
    blue: "bg-blue-500",
    green: "bg-green-500"
  };

  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={`w-2 h-2 ${colors[color]} rounded-full`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.2
          }}
        />
      ))}
    </div>
  );
};

export default LoadingDots; 