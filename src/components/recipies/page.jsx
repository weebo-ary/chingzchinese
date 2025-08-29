"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "../../integrations/supabase/client";
import { Edit, Save, X, Plus } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog"; // 🆕 Radix dialog

export default function ChefRecipes() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState("");

  // 🆕 Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState(null);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDesc, setModalDesc] = useState("");

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("menu_items")
      .select("id,name,category,recipe,created_at")
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      toast({ title: "Failed to load recipes", description: error.message, variant: "destructive" });
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (i) => i.name.toLowerCase().includes(term) || i.category.toLowerCase().includes(term)
    );
  }, [q, items]);

  const startEdit = (item) => {
    setEditingId(item.id);
    setDraft(item.recipe ?? "");
  };
  const cancelEdit = () => { setEditingId(null); setDraft(""); };

  const saveRecipe = async (id) => {
    const payload = { recipe: draft.trim() || null };
    const { error } = await supabase.from("menu_items").update(payload).eq("id", id);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, recipe: payload.recipe } : i)));
    toast({ title: "Saved", description: "Recipe updated for this item." });
    cancelEdit();
  };

  // 🆕 Open modal for a specific item, prefill title/description if possible
  const openAddRecipeModal = (item) => {
    setModalItem(item);
    const r = (item.recipe || "").trim();
    if (!r) {
      setModalTitle("");
      setModalDesc("");
    } else {
      // naive split: first empty line separates title & description
      const parts = r.split(/\n\s*\n/);
      if (parts.length >= 2) {
        setModalTitle(parts[0]);
        setModalDesc(parts.slice(1).join("\n\n"));
      } else {
        // if one block only, treat it as description
        setModalTitle("");
        setModalDesc(r);
      }
    }
    setModalOpen(true);
  };

  // 🆕 Save modal to Supabase (stores "Title\n\nDescription")
  const saveModalRecipe = async () => {
    if (!modalItem) return;
    const merged = [modalTitle.trim(), modalDesc.trim()].filter(Boolean).join("\n\n") || null;

    const { error } = await supabase
      .from("menu_items")
      .update({ recipe: merged })
      .eq("id", modalItem.id);

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }

    setItems((prev) => prev.map((i) => (i.id === modalItem.id ? { ...i, recipe: merged } : i)));
    toast({ title: "Saved", description: `Recipe ${merged ? "updated" : "cleared"} for ${modalItem.name}.` });
    setModalOpen(false);
    setModalItem(null);
    setModalTitle("");
    setModalDesc("");
  };

  const grouped = useMemo(() => {
    return filtered.reduce((acc, it) => {
      (acc[it.category] ||= []).push(it);
      return acc;
    }, {});
  }, [filtered]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Chef Recipes</h2>
        <p className="text-muted-foreground">Add and maintain preparation notes/recipes for each dish.</p>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Search by name or category…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-md"
        />
        <Button variant="outline" onClick={fetchItems} disabled={loading}>Refresh</Button>
      </div>

      {loading ? (
        <Card className="shadow-card">
          <CardContent className="py-8 text-center text-muted-foreground">Loading recipes…</CardContent>
        </Card>
      ) : Object.keys(grouped).length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="py-10 text-center text-muted-foreground">No dishes found.</CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, arr]) => (
            <Card key={category} className="shadow-card">
              <CardHeader>
                <CardTitle className="text-xl">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {arr.map((item) => {
                    const isEditing = editingId === item.id;
                    const hasRecipe = Boolean(item.recipe && item.recipe.trim());
                    return (
                      <div key={item.id} className="p-4 border rounded-lg bg-card">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="font-semibold">{item.name}</h4>

                            {/* view mode text */}
                            {!isEditing ? (
                              <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line break-words">
                                {hasRecipe ? item.recipe : "— No recipe yet —"}
                              </p>
                            ) : (
                              <div className="mt-2">
                                <Label className="text-xs">Recipe / Chef Notes</Label>
                                <textarea
                                  value={draft}
                                  onChange={(e) => setDraft(e.target.value)}
                                  rows={4}
                                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                                  placeholder="e.g., Prep, ingredients, timing, wok temp…"
                                />
                              </div>
                            )}
                          </div>

                          <div className="flex-shrink-0 flex flex-col gap-2">
                            {/* 🆕 Add/Edit Recipe modal trigger */}
                            <Button
                              size="sm"
                              onClick={() => openAddRecipeModal(item)}
                              className="bg-gradient-brand"
                              title={hasRecipe ? "Edit Recipe" : "Add Recipe"}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              {hasRecipe ? "Edit Recipe" : "Add Recipe"}
                            </Button>

                            {/* existing inline edit (kept) */}
                            {!isEditing ? (
                              <Button size="sm" variant="outline" onClick={() => startEdit(item)}>
                                <Edit className="h-4 w-4 mr-1" /> Quick Edit
                              </Button>
                            ) : (
                              <>
                                <Button size="sm" className="bg-gradient-brand" onClick={() => saveRecipe(item.id)}>
                                  <Save className="h-4 w-4 mr-1" /> Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelEdit}>
                                  <X className="h-4 w-4 mr-1" /> Cancel
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 🆕 Add/Edit Recipe Modal */}
      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 w-[90vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-lg focus:outline-none">
            <Dialog.Title className="text-lg font-semibold">
              {modalItem ? `Recipe for ${modalItem.name}` : "Add Recipe"}
            </Dialog.Title>

            <div className="mt-4 space-y-3">
              <div>
                <Label htmlFor="recipe-title">Title</Label>
                <Input
                  id="recipe-title"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="e.g., Veg Hakka Noodles"
                />
              </div>
              <div>
                <Label htmlFor="recipe-desc">Description / Steps</Label>
                <textarea
                  id="recipe-desc"
                  value={modalDesc}
                  onChange={(e) => setModalDesc(e.target.value)}
                  rows={6}
                  className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="Ingredients, prep steps, timings, wok temperature, plating…"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <Dialog.Close asChild>
                <Button variant="outline">Close</Button>
              </Dialog.Close>
              <Button
                onClick={saveModalRecipe}
                className="bg-gradient-brand hover:opacity-90"
                disabled={!modalItem}
              >
                Save
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}