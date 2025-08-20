import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

const categories = ["Starters", "Main Course", "Beverages", "Desserts"];

const MenuManagement = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    const savedItems = localStorage.getItem('chingz_menu');
    if (savedItems) {
      setMenuItems(JSON.parse(savedItems));
    }
  }, []);

  const saveToStorage = (items: MenuItem[]) => {
    localStorage.setItem('chingz_menu', JSON.stringify(items));
    setMenuItems(items);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.category) {
      toast({
        title: "Error",
        description: "Please fill all fields",
        variant: "destructive"
      });
      return;
    }

    const newItem: MenuItem = {
      id: editingItem?.id || Date.now().toString(),
      name: formData.name,
      price: parseFloat(formData.price),
      category: formData.category
    };

    let updatedItems;
    if (editingItem) {
      updatedItems = menuItems.map(item => 
        item.id === editingItem.id ? newItem : item
      );
      toast({
        title: "Success",
        description: "Menu item updated successfully!"
      });
    } else {
      updatedItems = [...menuItems, newItem];
      toast({
        title: "Success", 
        description: "Menu item added successfully!"
      });
    }

    saveToStorage(updatedItems);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: "", price: "", category: "" });
    setEditingItem(null);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      category: item.category
    });
  };

  const handleDelete = (id: string) => {
    const updatedItems = menuItems.filter(item => item.id !== id);
    saveToStorage(updatedItems);
    toast({
      title: "Success",
      description: "Menu item deleted successfully!"
    });
  };

  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Menu Management</h2>
        <p className="text-muted-foreground">Add, edit, and organize your menu items.</p>
      </div>

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
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
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

      <div className="space-y-6">
        {Object.entries(groupedItems).map(([category, items]) => (
          <Card key={category} className="shadow-card">
            <CardHeader>
              <CardTitle className="text-xl">{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                  <div key={item.id} className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-foreground">{item.name}</h4>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-restaurant-gold">₹{item.price.toFixed(2)}</p>
                  </div>
                ))}
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
};

export default MenuManagement;