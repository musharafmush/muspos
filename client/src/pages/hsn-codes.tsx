
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    PlusIcon,
    SearchIcon,
    MoreHorizontalIcon,
    PencilIcon,
    TrashIcon,
    EyeIcon,
    FileTextIcon,
    PercentIcon
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const hsnCodeFormSchema = z.object({
    hsnCode: z.string().min(4, "HSN code must be at least 4 characters"),
    description: z.string().min(3, "Description is required"),
    taxCategoryId: z.string().min(1, "Tax Category is required"), // Select returns string usually
    cgstRate: z.string().default("0"),
    sgstRate: z.string().default("0"),
    igstRate: z.string().default("0"),
    cessRate: z.string().default("0"),
    isActive: z.boolean().default(true),
});

type HsnCodeFormValues = z.infer<typeof hsnCodeFormSchema>;

interface TaxCategory {
    id: number;
    name: string;
    rate: number;
}

interface HsnCode {
    id: number;
    hsnCode: string;
    description: string;
    taxCategoryId: number;
    taxCategory?: TaxCategory;
    cgstRate: number;
    sgstRate: number;
    igstRate: number;
    cessRate: number;
    isActive: boolean;
    createdAt: string;
}

export default function HsnCodes() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedHsnCode, setSelectedHsnCode] = useState<HsnCode | null>(null);

    // Fetch HSN Codes
    const { data: hsnCodes = [], isLoading: isLoadingHsnCodes } = useQuery<HsnCode[]>({
        queryKey: ['/api/hsn-codes'],
    });

    // Fetch Tax Categories for dropdown
    const { data: taxCategories = [] } = useQuery<TaxCategory[]>({
        queryKey: ['/api/tax-categories'],
    });

    // Create form
    const createForm = useForm<HsnCodeFormValues>({
        resolver: zodResolver(hsnCodeFormSchema),
        defaultValues: {
            hsnCode: "",
            description: "",
            taxCategoryId: "",
            cgstRate: "0",
            sgstRate: "0",
            igstRate: "0",
            cessRate: "0",
            isActive: true,
        },
    });

    // Edit form
    const editForm = useForm<HsnCodeFormValues>({
        resolver: zodResolver(hsnCodeFormSchema),
        defaultValues: {
            hsnCode: "",
            description: "",
            taxCategoryId: "",
            cgstRate: "0",
            sgstRate: "0",
            igstRate: "0",
            cessRate: "0",
            isActive: true,
        },
    });

    // Create mutation
    const createHsnCodeMutation = useMutation({
        mutationFn: async (data: HsnCodeFormValues) => {
            // transform taxCategoryId to number
            const payload = {
                ...data,
                taxCategoryId: parseInt(data.taxCategoryId),
            };
            const res = await apiRequest("POST", "/api/hsn-codes", payload);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/hsn-codes"] });
            setIsCreateDialogOpen(false);
            createForm.reset();
            toast({
                title: "Success",
                description: "HSN Code created successfully",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Update mutation
    const updateHsnCodeMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: HsnCodeFormValues }) => {
            const payload = {
                ...data,
                taxCategoryId: parseInt(data.taxCategoryId),
            };
            const res = await apiRequest("PUT", `/api/hsn-codes/${id}`, payload);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/hsn-codes"] });
            setIsEditDialogOpen(false);
            setSelectedHsnCode(null);
            toast({
                title: "Success",
                description: "HSN Code updated successfully",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    // Delete mutation
    const deleteHsnCodeMutation = useMutation({
        mutationFn: async (id: number) => {
            const res = await apiRequest("DELETE", `/api/hsn-codes/${id}`);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/hsn-codes"] });
            setIsDeleteDialogOpen(false);
            setSelectedHsnCode(null);
            toast({
                title: "Success",
                description: "HSN Code deleted successfully",
            });
        },
        onError: (error: Error) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const handleCreate = () => {
        createForm.reset();
        setIsCreateDialogOpen(true);
    };

    const handleEdit = (hsn: HsnCode) => {
        setSelectedHsnCode(hsn);
        editForm.reset({
            hsnCode: hsn.hsnCode,
            description: hsn.description,
            taxCategoryId: hsn.taxCategoryId.toString(),
            cgstRate: hsn.cgstRate.toString(),
            sgstRate: hsn.sgstRate.toString(),
            igstRate: hsn.igstRate.toString(),
            cessRate: hsn.cessRate.toString(),
            isActive: hsn.isActive,
        });
        setIsEditDialogOpen(true);
    };

    const handleDelete = (hsn: HsnCode) => {
        setSelectedHsnCode(hsn);
        setIsDeleteDialogOpen(true);
    };

    const onCreateSubmit = (data: HsnCodeFormValues) => {
        createHsnCodeMutation.mutate(data);
    };

    const onEditSubmit = (data: HsnCodeFormValues) => {
        if (selectedHsnCode) {
            updateHsnCodeMutation.mutate({ id: selectedHsnCode.id, data });
        }
    };

    const filteredHsnCodes = hsnCodes.filter((hsn: HsnCode) =>
        hsn.hsnCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hsn.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <FileTextIcon className="h-8 w-8 text-blue-600" />
                            HSN Codes
                        </h1>
                        <p className="text-muted-foreground">
                            Manage Harmonized System of Nomenclature codes and tax rates
                        </p>
                    </div>
                    <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add HSN Code
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>HSN Code List</CardTitle>
                                <CardDescription>All configured HSN codes and rates</CardDescription>
                            </div>
                            <div className="relative w-64">
                                <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search HSN codes..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>HSN Code</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>CGST %</TableHead>
                                    <TableHead>SGST %</TableHead>
                                    <TableHead>IGST %</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredHsnCodes.map((hsn: HsnCode) => (
                                    <TableRow key={hsn.id}>
                                        <TableCell className="font-medium">{hsn.hsnCode}</TableCell>
                                        <TableCell>{hsn.description}</TableCell>
                                        <TableCell>{hsn.taxCategory?.name || '-'}</TableCell>
                                        <TableCell>{hsn.cgstRate}%</TableCell>
                                        <TableCell>{hsn.sgstRate}%</TableCell>
                                        <TableCell>{hsn.igstRate}%</TableCell>
                                        <TableCell>
                                            <div className={`px-2 py-1 rounded-full text-xs w-fit ${hsn.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {hsn.isActive ? 'Active' : 'Inactive'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontalIcon className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEdit(hsn)}>
                                                        <PencilIcon className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleDelete(hsn)} className="text-red-600">
                                                        <TrashIcon className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredHsnCodes.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                            No HSN codes found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Create Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Add New HSN Code</DialogTitle>
                        <DialogDescription>Create a new HSN code configuration</DialogDescription>
                    </DialogHeader>
                    <Form {...createForm}>
                        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={createForm.control}
                                    name="hsnCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>HSN Code *</FormLabel>
                                            <FormControl><Input placeholder="e.g. 1905" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="taxCategoryId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tax Category *</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a category" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {taxCategories.map((cat: TaxCategory) => (
                                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                                            {cat.name} ({cat.rate}%)
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={createForm.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description *</FormLabel>
                                        <FormControl><Textarea placeholder="Item description" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-4 gap-2">
                                <FormField
                                    control={createForm.control}
                                    name="cgstRate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>CGST %</FormLabel>
                                            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="sgstRate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>SGST %</FormLabel>
                                            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="igstRate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>IGST %</FormLabel>
                                            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="cessRate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cess %</FormLabel>
                                            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={createForm.control}
                                name="isActive"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>
                                                Active
                                            </FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={createHsnCodeMutation.isPending}>
                                    {createHsnCodeMutation.isPending && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                                    Create
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edit HSN Code</DialogTitle>
                    </DialogHeader>
                    <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={editForm.control}
                                    name="hsnCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>HSN Code *</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={editForm.control}
                                    name="taxCategoryId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tax Category *</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a category" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {taxCategories.map((cat: TaxCategory) => (
                                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                                            {cat.name} ({cat.rate}%)
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={editForm.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description *</FormLabel>
                                        <FormControl><Textarea {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-4 gap-2">
                                <FormField
                                    control={editForm.control}
                                    name="cgstRate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>CGST %</FormLabel>
                                            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={editForm.control}
                                    name="sgstRate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>SGST %</FormLabel>
                                            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={editForm.control}
                                    name="igstRate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>IGST %</FormLabel>
                                            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={editForm.control}
                                    name="cessRate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cess %</FormLabel>
                                            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={editForm.control}
                                name="isActive"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>
                                                Active
                                            </FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={updateHsnCodeMutation.isPending}>
                                    {updateHsnCodeMutation.isPending && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete HSN Code</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {selectedHsnCode?.hsnCode}? This will affect all new products using this code.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (selectedHsnCode) {
                                    deleteHsnCodeMutation.mutate(selectedHsnCode.id);
                                }
                            }}
                            disabled={deleteHsnCodeMutation.isPending}
                        >
                            {deleteHsnCodeMutation.isPending ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
