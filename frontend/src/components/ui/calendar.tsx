"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker@8.10.1";
import "react-day-picker@8.10.1/dist/style.css";

import { cn } from "./utils";

function Calendar({ className, ...props }: React.ComponentProps<typeof DayPicker>) {
  return <DayPicker className={cn("p-3", className)} {...props} />;
}

export { Calendar };
