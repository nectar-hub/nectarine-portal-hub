import { useState } from "react";
import { ShippingRate } from "@/hooks/useShippingRates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Settings } from "lucide-react";

interface Props {
  rates: ShippingRate[];
  loading: boolean;
  onAdd: (code: string, name: string, rate: number, currencyCode?: string, currencySymbol?: string) => Promise<boolean>;
  onUpdate: (id: string, updates: Partial<Pick<ShippingRate, "country_code" | "country_name" | "rate_per_kg" | "is_active" | "currency_code" | "currency_symbol">>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export function ShippingRatesManager({ rates, loading, onAdd, onUpdate, onDelete }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ShippingRate | null>(null);
  const [countryCode, setCountryCode] = useState("");
  const [countryName, setCountryName] = useState("");
  const [ratePerKg, setRatePerKg] = useState("");
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openAdd = () => {
    setEditingRate(null);
    setCountryCode("");
    setCountryName("");
    setRatePerKg("");
    setCurrencyCode("USD");
    setCurrencySymbol("$");
    setDialogOpen(true);
  };

  const openEdit = (rate: ShippingRate) => {
    setEditingRate(rate);
    setCountryCode(rate.country_code);
    setCountryName(rate.country_name);
    setRatePerKg(String(rate.rate_per_kg));
    setCurrencyCode(rate.currency_code);
    setCurrencySymbol(rate.currency_symbol);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const rate = parseFloat(ratePerKg);
    if (!countryCode.trim() || !countryName.trim() || isNaN(rate) || rate <= 0) return;

    let success: boolean;
    if (editingRate) {
      success = await onUpdate(editingRate.id, {
        country_code: countryCode.trim().toUpperCase(),
        country_name: countryName.trim(),
        rate_per_kg: rate,
        currency_code: currencyCode,
        currency_symbol: currencySymbol,
      });
    } else {
      success = await onAdd(countryCode.trim().toUpperCase(), countryName.trim(), rate, currencyCode, currencySymbol);
    }
    if (success) setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    await onDelete(id);
    setDeleteConfirm(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Manage Shipping Rates
              </CardTitle>
              <CardDescription>Add, edit, or remove origin countries and their rates</CardDescription>
            </div>
            <Button onClick={openAdd} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Country
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading rates...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Rate / kg</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono">{r.country_code}</TableCell>
                    <TableCell>{r.country_name}</TableCell>
                    <TableCell>${r.rate_per_kg}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(r.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {rates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No shipping rates configured
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRate ? "Edit Shipping Rate" : "Add Origin Country"}</DialogTitle>
            <DialogDescription>
              {editingRate ? "Update the country details and rate per kg." : "Enter the new origin country details."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Country Code</Label>
              <Input placeholder="e.g. US" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} maxLength={3} />
            </div>
            <div className="space-y-2">
              <Label>Country Name</Label>
              <Input placeholder="e.g. United States" value={countryName} onChange={(e) => setCountryName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Rate per kg ($)</Label>
              <Input type="number" min="0" step="0.5" placeholder="e.g. 12" value={ratePerKg} onChange={(e) => setRatePerKg(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!countryCode.trim() || !countryName.trim() || !ratePerKg}>
              {editingRate ? "Save Changes" : "Add Country"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Country</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this origin country? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
