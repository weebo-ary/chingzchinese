"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Edit, Plus, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../../integrations/supabase/client"; // adjust path if needed

const categories = ["Starters", "Main Course", "Beverages", "Desserts"];
const RESTAURANT = "chingz_chinese"; // 👈 constant key

export default function MenuManagement() {
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
  });

  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineDraft, setInlineDraft] = useState({
    name: "",
    price: "",
    category: "",
  });

  // 🔽 fetch from Supabase
  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("restaurant", RESTAURANT)
      .order("category", { ascending: true });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setMenuItems(data || []);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // ---------- Add / Top-form edit ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    const priceNum = parseFloat(formData.price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      toast({ title: "Invalid price", description: "Enter a valid positive number.", variant: "destructive" });
      return;
    }

    if (editingItem) {
      // Update existing
      const { error } = await supabase
        .from("menu_items")
        .update({
          name: formData.name.trim(),
          price: priceNum,
          category: formData.category,
        })
        .eq("id", editingItem.id);

      if (error) {
        toast({ title: "Update failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Menu item updated successfully!" });
        fetchItems();
      }
    } else {
      // Insert new
      const { error } = await supabase.from("menu_items").insert({
        restaurant: RESTAURANT,
        name: formData.name.trim(),
        price: priceNum,
        category: formData.category,
      });

      if (error) {
        toast({ title: "Insert failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Menu item added successfully!" });
        fetchItems();
      }
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: "", price: "", category: "" });
    setEditingItem(null);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Menu item deleted successfully!" });
      fetchItems();
    }
  };

  // ---------- Inline edit handlers ----------
  const startInlineEdit = (item: any) => {
    setInlineEditId(item.id);
    setInlineDraft({
      name: item.name,
      price: item.price.toString(),
      category: item.category,
    });
  };

  const cancelInlineEdit = () => {
    setInlineEditId(null);
  };

  const saveInlineEdit = async (id: string) => {
    const name = inlineDraft.name.trim();
    const priceNum = parseFloat(inlineDraft.price);

    if (!name || !inlineDraft.price || !inlineDraft.category) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }
    if (Number.isNaN(priceNum) || priceNum < 0) {
      toast({ title: "Invalid price", description: "Enter a valid positive number.", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("menu_items")
      .update({ name, price: priceNum, category: inlineDraft.category })
      .eq("id", id);

    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Menu item updated!" });
      fetchItems();
    }
    setInlineEditId(null);
  };

  const groupedItems = menuItems.reduce((acc: any, item: any) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Menu Management</h2>
        <p className="text-muted-foreground">Add, edit, and organize your menu items.</p>
      </div>

      {/* Top Form */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {editingItem ? "Edit Menu Item" : "Add New Menu Item"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="name">Item Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Chicken Chowmein"
                />
              </div>
              <div>
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  inputMode="decimal"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="bg-gradient-brand hover:opacity-90">
                {editingItem ? "Update Item" : "Add Item"}
              </Button>
              {editingItem && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Items grouped by category */}
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([category, items]: any) => (
          <Card key={category} className="shadow-card">
            <CardHeader>
              <CardTitle className="text-xl">{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item: any) => {
                  const isInline = inlineEditId === item.id;
                  return (
                    <div key={item.id} className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow">
                      {!isInline ? (
                        <>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-foreground">{item.name}</h4>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" onClick={() => startInlineEdit(item)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-lg font-bold text-restaurant-gold">₹{item.price.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground mt-1">{item.category}</p>
                        </>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs">Item Name</Label>
                            <Input
                              value={inlineDraft.name}
                              onChange={(e) => setInlineDraft((d) => ({ ...d, name: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Price (₹)</Label>
                            <Input
                              type="number"
                              inputMode="decimal"
                              step="0.01"
                              value={inlineDraft.price}
                              onChange={(e) => setInlineDraft((d) => ({ ...d, price: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Category</Label>
                            <Select
                              value={inlineDraft.category}
                              onValueChange={(v) => setInlineDraft((d) => ({ ...d, category: v }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((c) => (
                                  <SelectItem key={c} value={c}>
                                    {c}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Button size="sm" onClick={() => saveInlineEdit(item.id)} className="bg-gradient-brand">
                              <Check className="h-4 w-4 mr-1" /> Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelInlineEdit}>
                              <X className="h-4 w-4 mr-1" /> Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {menuItems.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">🍜</div>
            <h3 className="text-xl font-semibold mb-2">No menu items yet</h3>
            <p className="text-muted-foreground">Add your first menu item to get started!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
