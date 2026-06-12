import React, { useState, useEffect } from "react";
import { View } from "react-native";
import { useFormContext } from "react-hook-form";
import PhotoCaptureScreen from "../PhotoCaptureScreen";
const MIN_IMAGES = 4;
type Step5Props = {
    onImagesChange?: (images: string[]) => void;
};
const Step5 = ({ onImagesChange }: Step5Props) => {
    const form = useFormContext();
    const existingImages = form.watch("property_images") || [];
    const [images, setImages] = useState<string[]>(Array.isArray(existingImages) ? existingImages : []);
    useEffect(() => {
        if (Array.isArray(existingImages) &&
            existingImages.length > 0 &&
            images.length === 0) {
            setImages(existingImages);
        }
    }, [existingImages]);
    const handleImagesChange = (next: string[]) => {
        setImages(next);
        form.setValue("property_images", next);
        onImagesChange?.(next);
    };
    return (<View style={{ flex: 1 }}>
      <PhotoCaptureScreen images={images} onImagesChange={handleImagesChange} minImages={MIN_IMAGES} title="Captured photos"/>
    </View>);
};
export default Step5;
