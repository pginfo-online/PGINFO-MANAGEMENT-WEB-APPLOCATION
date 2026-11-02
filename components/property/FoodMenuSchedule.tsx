"use client";

import React, { useState } from "react";
import { UtensilsCrossed, Calendar, Check, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function FoodMenuSchedule() {
  const [selectedDay, setSelectedDay] = useState("Monday");

  const weeklyMenu: Record<string, { breakfast: string; lunch: string; snacks: string; dinner: string }> = {
    Monday: {
      breakfast: "Poha, Boiled Eggs / Banana, Tea / Coffee",
      lunch: "Dal Tadka, Jeera Rice, Chapati, Aloo Gobhi, Curd",
      snacks: "Veg Sandwich, Green Chutney, Tea",
      dinner: "Paneer Butter Masala, Roti, Rice, Gulab Jamun",
    },
    Tuesday: {
      breakfast: "Idli Sambar, Coconut Chutney, Coffee",
      lunch: "Rajma Masala, Steamed Rice, Phulka, Cucumber Salad",
      snacks: "Samosa with Sweet Chutney, Tea",
      dinner: "Chicken Curry / Mushroom Matar, Roti, Jeera Rice",
    },
    Wednesday: {
      breakfast: "Aloo Paratha, Butter, Pickle, Curd",
      lunch: "Chole Bhature, Boondi Raita, Onion Salad",
      snacks: "Biscuits & Filter Coffee",
      dinner: "Mix Veg Handi, Dal Fry, Roti, Rice",
    },
    Thursday: {
      breakfast: "Upma, Coconut Chutney, Masala Chai",
      lunch: "Kadhi Pakora, Rice, Roti, Bhindi Masala",
      snacks: "Bhel Puri / Sev Puri",
      dinner: "Egg Curry / Malai Kofta, Tandoori Roti, Pulao",
    },
    Friday: {
      breakfast: "Masala Dosa, Sambar, Filter Coffee",
      lunch: "Dal Makhani, Jeera Rice, Naan, Paneer Tikka",
      snacks: "Pakora with Mint Dip",
      dinner: "Hyderabadi Veg / Chicken Biryani, Mirchi Ka Salan",
    },
    Saturday: {
      breakfast: "Puri Bhaji, Halwa, Tea",
      lunch: "Sambar Rice, Poriyal, Appalam, Curd Rice",
      snacks: "Cake & Milkshake",
      dinner: "Veg Pulao, Paneer Do Pyaza, Laccha Paratha",
    },
    Sunday: {
      breakfast: "Chole Kulche, Lassi",
      lunch: "Special Feast: Butter Chicken / Shahi Paneer, Biryani",
      snacks: "Tea & Cookies",
      dinner: "Light Khichdi, Kadhi, Roasted Papad",
    },
  };

  const current = weeklyMenu[selectedDay];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Weekly Food Menu & Mess</h1>
          <p className="text-xs text-slate-500 mt-1">
            Weekly meal schedule, tenant diet preferences, and catering attendance
          </p>
        </div>

        <button
          onClick={() => toast.success("Guest meal coupon recorded (+₹150)")}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Guest Meal</span>
        </button>
      </div>

      {/* Days of Week Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-200 pb-2">
        {Object.keys(weeklyMenu).map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer",
              selectedDay === day
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            {day}
          </button>
        ))}
      </div>

      {/* 4 Meals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase">Breakfast (8-10 AM)</span>
            <span className="text-xl">☕</span>
          </div>
          <p className="text-sm font-bold text-slate-900 leading-snug">{current.breakfast}</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase">Lunch (12-2:30 PM)</span>
            <span className="text-xl">🍲</span>
          </div>
          <p className="text-sm font-bold text-slate-900 leading-snug">{current.lunch}</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 uppercase">Snacks (5-6:30 PM)</span>
            <span className="text-xl">🥪</span>
          </div>
          <p className="text-sm font-bold text-slate-900 leading-snug">{current.snacks}</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-600 uppercase">Dinner (8-10 PM)</span>
            <span className="text-xl">🍛</span>
          </div>
          <p className="text-sm font-bold text-slate-900 leading-snug">{current.dinner}</p>
        </div>
      </div>
    </div>
  );
}
