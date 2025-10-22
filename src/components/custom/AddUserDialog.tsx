// src/components/custom/AddUserDialog.tsx
"use client"; // यह एक क्लाइंट कंपोनेंट है क्योंकि इसमें स्टेट और इंटरेक्शन है

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// सर्वर एक्शन को यहाँ इम्पोर्ट करें (इसे हम अगले चरण में बनाएंगे)
import { addUser } from "@/app/(main)/admin/users/actions";

export function AddUserDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await addUser(formData);

    if (result?.error) {
      setError(result.error);
    } else {
      setIsOpen(false); // सफलता पर डायलॉग बंद करें
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>नया यूज़र जोड़ें</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>नया यूज़र बनाएँ</DialogTitle>
            <DialogDescription>
              यहाँ यूज़र की जानकारी दर्ज करें। उसे एक अस्थायी पासवर्ड दिया जाएगा।
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="full_name" className="text-right">पूरा नाम</Label>
              <Input id="full_name" name="full_name" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">ईमेल</Label>
              <Input id="email" name="email" type="email" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">पासवर्ड</Label>
              <Input id="password" name="password" type="password" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">भूमिका</Label>
              <Select name="role" required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="एक भूमिका चुनें" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="je">JE</SelectItem>
                  <SelectItem value="division_head">Division Head</SelectItem>
                  <SelectItem value="circle_head">Circle Head</SelectItem>
                  <SelectItem value="zone_head">Zone Head</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="value" className="text-right">मान (Value)</Label>
              <Input id="value" name="value" placeholder="जैसे: ECD AGRA" className="col-span-3" />
            </div>
          </div>
           {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <DialogFooter>
            <Button type="submit">यूज़र सेव करें</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}