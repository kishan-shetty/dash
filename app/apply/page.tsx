'use client'

import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Supabase
import { createClient } from '@supabase/supabase-js';

// Define the schema for the form data using Zod, matching the database table
const formSchema = z.object({
    full_name: z.string().min(2, {
        message: "Full name must be at least 2 characters.",
    }),
    email: z.string().email({
        message: "Invalid email address.",
    }),
    contact_number: z.string().min(10, { message: "Contact number must be at least 10 digits" }),
    gender: z.string().optional(),
    qualification: z.string().min(2, { message: "Qualification is required" }),
    year_of_completion: z.string().min(4, { message: "Year of completion is required" }),
    college_name: z.string().min(2, { message: "College name is required" }),
    hod_name: z.string().optional(), // Made optional
    hod_contact: z.string().optional(), // Made optional
    hod_email: z.string().optional(), // Made optional and email validated
    batch: z.string().min(1, { message: "Please select a batch" }),
    reference: z.string().min(2, { message: "Reference is required" }),
});

interface Batch {
    id: string;
    startDate: Date;
    endDate: Date;
}

// Supabase setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface ApplyPageProps {
    // We can define props here if needed, but for now, it's a simple page
}

const ApplyPage: React.FC<ApplyPageProps> = () => {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(false);
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // React Hook Form setup
    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset
    } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            full_name: "",
            email: "",
            contact_number: "",
            gender: "",
            qualification: "",
            year_of_completion: "",
            college_name: "",
            hod_name: "",
            hod_contact: "",
            hod_email: "",
            batch: "",
            reference: "",
        },
    });

    // Function to calculate batch dates
    const calculateBatches = (numberOfBatches: number): Batch[] => {
        const today = new Date();
        let currentStartDate = new Date(today);

        // Find the next Monday
        if (currentStartDate.getDay() > 1) {
            currentStartDate.setDate(currentStartDate.getDate() + (8 - currentStartDate.getDay()));
        } else if (currentStartDate.getDay() === 0) {
            currentStartDate.setDate(currentStartDate.getDate() + 1);
        }

        const calculatedBatches: Batch[] = [];
        for (let i = 0; i < numberOfBatches; i++) {
            const startDate = new Date(currentStartDate);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 12); // 11 days for a two-week batch (Mon-Sat)
            const batchNumber = 36 + i; // Start from Batch 36
            const batchId = `Batch ${batchNumber}`;

            calculatedBatches.push({
                id: batchId,
                startDate: startDate,
                endDate: endDate,
            });
            // Calculate the start date for the *next* batch (skip one Monday)
            currentStartDate.setDate(currentStartDate.getDate() + 14); // Add 14 days
        }
        return calculatedBatches;
    };

    // Format date for display
    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

      // UseEffect to calculate batches on component mount
    useEffect(() => {
        const initialBatches = calculateBatches(6);
        setBatches(initialBatches);
    }, []);

    // Function to handle form submission
    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        setLoading(true);
        setSubmissionStatus('idle');
        try {
            // Find the selected batch object
            const selectedBatch = batches.find(b => b.id === data.batch);

            if (!selectedBatch) {
                console.error("Selected batch not found!");
                setSubmissionStatus('error');
                setLoading(false);
                return; // Stop submission if batch is not found
            }
            const batchValue = `${selectedBatch.id} (${formatDate(selectedBatch.startDate)} - ${formatDate(selectedBatch.endDate)})`;
            const { error } = await supabase
                .from('candidates')
                .insert([{
                    full_name: data.full_name,
                    email: data.email,
                    contact_number: data.contact_number,
                    gender: data.gender,
                    qualification: data.qualification,
                    year_of_completion: data.year_of_completion,
                    college_name: data.college_name,
                    hod_name: data.hod_name,
                    hod_contact: data.hod_contact,
                    hod_email: data.hod_email,
                    batch: batchValue, // Store batch name and dates
                    reference: data.reference,
                }]);

            if (error) {
                console.error("Error submitting application:", error);
                setSubmissionStatus('error');
            } else {
                setSubmissionStatus('success');
                reset();
            }
        } catch (error) {
            console.error("Error submitting application:", error);
            setSubmissionStatus('error');
        } finally {
            setLoading(false);
        }
    };

    const qualificationOptions = [
        "BE/B.Tech in Aeronautical",
        "BE/B.Tech in Aerospace",
        "BE/B.Tech in Mechanical",
        "BE/B.Tech in Automotive",
        "ME/M.Tech in Aeronautical",
        "ME/M.Tech in Aerospace",
        "ME/M.Tech in Mechanical",
        "ME/M.Tech in Automotive",
    ];

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-2xl p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <h1 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">
                    Internship Application Form
                </h1>
                <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Please fill out the form below to apply for the internship program.
                    </p>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <Label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Full Name
                        </Label>
                        <Controller
                            name="full_name"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    type="text"
                                    placeholder="Enter your full name"
                                    className={cn("mt-1 w-full", errors.full_name && "border-red-500")}
                                    disabled={isSubmitting}
                                />
                            )}
                        />
                        {errors.full_name && (
                            <p className="text-red-500 text-sm mt-1">{errors.full_name.message}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email ID
                        </Label>
                        <Controller
                            name="email"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    type="email"
                                    placeholder="Enter your email address"
                                    className={cn("mt-1 w-full", errors.email && "border-red-500")}
                                    disabled={isSubmitting}
                                />
                            )}
                        />
                        {errors.email && (
                            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Contact Number
                        </Label>
                        <Controller
                            name="contact_number"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    type="tel"
                                    placeholder="Enter your contact number"
                                    className={cn("mt-1 w-full", errors.contact_number && "border-red-500")}
                                    disabled={isSubmitting}
                                />
                            )}
                        />
                        {errors.contact_number && (
                            <p className="text-red-500 text-sm mt-1">{errors.contact_number.message}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Gender
                        </Label>
                        <Controller
                            name="gender"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger className={cn("mt-1 w-full", errors.gender && "border-red-500")}>
                                        <SelectValue placeholder="Select your gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.gender && (
                            <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="qualification" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Qualification
                        </Label>
                        <Controller
                            name="qualification"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger className={cn("mt-1 w-full", errors.qualification && "border-red-500")}>
                                        <SelectValue placeholder="Select your qualification" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {qualificationOptions.map((option) => (
                                            <SelectItem key={option} value={option}>
                                                {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.qualification && (
                            <p className="text-red-500 text-sm mt-1">{errors.qualification.message}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="yearOfCompletion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Year of Completion
                        </Label>
                        <Controller
                            name="year_of_completion"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    type="text"
                                    placeholder="Enter your year of completion"
                                    className={cn("mt-1 w-full", errors.year_of_completion && "border-red-500")}
                                    disabled={isSubmitting}
                                />
                            )}
                        />
                        {errors.year_of_completion && (
                            <p className="text-red-500 text-sm mt-1">{errors.year_of_completion.message}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="collegeName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Name of College
                        </Label>
                        <Controller
                            name="college_name"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    type="text"
                                    placeholder="Enter your college name"
                                    className={cn("mt-1 w-full", errors.college_name && "border-red-500")}
                                    disabled={isSubmitting}
                                />
                            )}
                        />
                        {errors.college_name && (
                            <p className="text-red-500 text-sm mt-1">{errors.college_name.message}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="hodName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Name of HOD
                        </Label>
                        <Controller
                            name="hod_name"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    type="text"
                                    placeholder="Enter HOD's name"
                                    className={cn("mt-1 w-full")}
                                    disabled={isSubmitting}
                                />
                            )}
                        />
                    </div>
                    <div>
                        <Label htmlFor="hodContact" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Contact of HOD
                        </Label>
                        <Controller
                            name="hod_contact"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    type="tel"
                                    placeholder="Enter HOD's contact number"
                                    className={cn("mt-1 w-full")}
                                    disabled={isSubmitting}
                                />
                            )}
                        />
                    </div>
                    <div>
                        <Label htmlFor="hodEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email ID of HOD
                        </Label>
                        <Controller
                            name="hod_email"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    type="email"
                                    placeholder="Enter HOD's email address"
                                    className={cn("mt-1 w-full")}
                                    disabled={isSubmitting}
                                />
                            )}
                        />
                         {errors.hod_email && (
                            <p className="text-red-500 text-sm mt-1">{errors.hod_email.message}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="batch" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Select a Batch
                        </Label>
                        <Controller
                            name="batch"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={isSubmitting}
                                >
                                    <SelectTrigger className={cn("mt-1 w-full", errors.batch && "border-red-500")}>
                                        <SelectValue placeholder="Select a batch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {batches.map((batch) => (
                                            <SelectItem key={batch.id} value={batch.id}>
                                                {`${batch.id} (${formatDate(batch.startDate)} - ${formatDate(batch.endDate)})`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.batch && (
                            <p className="text-red-500 text-sm mt-1">{errors.batch.message}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="reference" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Reference (How did you hear about us?)
                        </Label>
                        <Controller
                            name="reference"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    {...field}
                                    type="text"
                                    placeholder="How did you hear about our program?"
                                    className={cn("mt-1 w-full", errors.reference && "border-red-500")}
                                    disabled={isSubmitting}
                                />
                            )}
                        />
                        {errors.reference && (
                            <p className="text-red-500 text-sm mt-1">{errors.reference.message}</p>
                        )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting || loading}>
                        {loading ? 'Submitting...' : 'Submit Application'}
                    </Button>

                    {submissionStatus === 'success' && (
                        <p className="text-green-500 text-center mt-4">Application submitted successfully!</p>
                    )}
                    {submissionStatus === 'error' && (
                        <p className="text-red-500 text-center mt-4">Error submitting application. Please try again.</p>
                    )}
                </form>
            </div>
        </div>
    );
};

export default ApplyPage;
