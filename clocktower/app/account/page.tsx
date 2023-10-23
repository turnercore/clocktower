// Import necessary libraries and components
'use client'
import React, { useState, useEffect } from "react";
import { Input, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui";
import { HexColorPicker } from "react-colorful";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Create a component for the icon picker dialog
const IconPickerDialog: React.FC<{ onConfirm: (icon: string, bgColor: string, iconColor: string) => void }> = ({ onConfirm }) => {
  const [selectedIcon, setSelectedIcon] = useState<string>("");
  const [bgColor, setBgColor] = useState<string>("#ffffff");
  const [iconColor, setIconColor] = useState<string>("#000000");

  const handleUpdate = () => {
    onConfirm(selectedIcon, bgColor, iconColor);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Edit Icon</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Icon</DialogTitle>
        </DialogHeader>
        {/* Icon Selection */}
        {/* ... */}
        {/* Background Color Selection */}
        <HexColorPicker color={bgColor} onChange={setBgColor} />
        {/* Icon Color Selection */}
        <HexColorPicker color={iconColor} onChange={setIconColor} />
        <Button onClick={handleUpdate}>Update</Button>
        <Button>Cancel</Button>
      </DialogContent>
    </Dialog>
  )
}

// Create the main Account component
const Account: React.FC = () => {
  const supabase = createClientComponentClient();
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [icon, setIcon] = useState<string>("");
  const [iconBgColor, setIconBgColor] = useState<string>("#ffffff");
  const [iconColor, setIconColor] = useState<string>("#000000");

  useEffect(() => {
    // Load user data
    // ...
  }, []);

  const handleUsernameChange = async (newUsername: string) => {
    // Check if username is not in use
    // ...
  };

  const handleIconUpdate = (newIcon: string, newBgColor: string, newIconColor: string) => {
    setIcon(newIcon);
    setIconBgColor(newBgColor);
    setIconColor(newIconColor);
    // Update icon data on the server
    // ...
  };

  return (
    <div className="account-page">
      <div className="user-info">
        <label>Username: </label>
        <Input type="text" value={username} onChange={(e) => setUsername(e.target.value)} onBlur={() => handleUsernameChange(username)} />
        <label>Email: </label>
        <Input type="email" value={email} disabled />
        <label>Full Name: </label>
        <Input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <IconPickerDialog onConfirm={handleIconUpdate} />
      {/* Display the selected icon with the chosen colors */}
      <div className="icon-display" style={{ backgroundColor: iconBgColor, color: iconColor }}>
        {icon} {/* Assume icon is a string representing an SVG or other icon format */}
      </div>
    </div>
  );
};

export default Account;
