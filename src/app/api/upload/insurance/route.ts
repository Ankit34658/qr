import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const qr_id = formData.get('qr_id') as string;

        console.log('📄 Insurance Upload Request:', {
            fileName: file?.name,
            fileSize: file?.size,
            qr_id,
            fileType: file?.type
        });

        if (!file || !qr_id) {
            return NextResponse.json({
                success: false,
                error: 'Missing file or QR ID'
            }, { status: 400 });
        }

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({
                success: false,
                error: 'File too large. Maximum 5MB allowed.'
            }, { status: 400 });
        }

        // Check file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({
                success: false,
                error: 'Invalid file type. Only PDF, JPG, PNG allowed.'
            }, { status: 400 });
        }

        // Create unique filename
        const fileExtension = file.name.split('.').pop();
        const fileName = `${qr_id}_${Date.now()}.${fileExtension}`;
        const filePath = `insurance/${fileName}`;

        console.log('📤 Uploading to path:', filePath);

        // Convert file to ArrayBuffer for Supabase
        const arrayBuffer = await file.arrayBuffer();

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('insurance-documents')
            .upload(filePath, arrayBuffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: true // Replace if exists
            });

        if (uploadError) {
            console.error('❌ Supabase Upload Error:', uploadError);

            // Check if bucket exists
            if (uploadError.message.includes('Bucket not found')) {
                return NextResponse.json({
                    success: false,
                    error: 'Storage not configured. Please contact support.'
                }, { status: 500 });
            }

            throw uploadError;
        }

        console.log('✅ Upload successful:', uploadData);

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('insurance-documents')
            .getPublicUrl(uploadData.path);

        if (!urlData.publicUrl) {
            throw new Error('Failed to get public URL');
        }

        console.log('🔗 Public URL generated:', urlData.publicUrl);

        // Update QR code with insurance URL
        const { data: updateData, error: updateError } = await supabase
            .from('qr_codes')
            .update({ insurance_pdf_url: urlData.publicUrl })
            .eq('id', qr_id)
            .select()
            .single();

        if (updateError) {
            console.error('❌ Database Update Error:', updateError);
            throw updateError;
        }

        console.log('✅ Database updated successfully');

        return NextResponse.json({
            success: true,
            url: urlData.publicUrl,
            fileName: fileName,
            message: 'Insurance uploaded successfully'
        });

    } catch (error: any) {
        console.error('❌ Insurance Upload Failed:', error);

        return NextResponse.json({
            success: false,
            error: error.message || 'Upload failed'
        }, { status: 500 });
    }
}