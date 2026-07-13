import { useState, useRef, useEffect, useCallback } from 'react';
import { NEWS_LAYOUT } from '../config/layoutConstants';

export function useCanvasElements() {
  const [backgroundImages, setBackgroundImages] = useState([]);
  const [logos, setLogos] = useState([]);
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [selectedLogo, setSelectedLogo] = useState(null);
  const [copiedTransform, setCopiedTransform] = useState(null);
  const blobUrlsRef = useRef([]);

  useEffect(() => {
    return () => {
      // Cleanup all Blob URLs on unmount
      blobUrlsRef.current.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {
          console.error("Error revoking object URL:", e);
        }
      });
    };
  }, []);

  const handleBackgroundUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    setBackgroundImages(prev => {
      const objectUrl = URL.createObjectURL(file);
      blobUrlsRef.current.push(objectUrl);

      const newImage = {
        id: `bg-${Date.now()}`,
        src: objectUrl,
        position: { x: NEWS_LAYOUT.USER_IMAGE.startX, y: NEWS_LAYOUT.USER_IMAGE.startY },
        scale: { scaleX: NEWS_LAYOUT.USER_IMAGE.defaultScaleX, scaleY: NEWS_LAYOUT.USER_IMAGE.defaultScaleY },
        blurRadius: 0
      };
      
      setSelectedBackground(newImage.id);
      setSelectedLogo(null);
      return [newImage, ...prev];
    });

    e.target.value = null;
  }, []);

  const handleLogoUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLogos(prev => {
      if (prev.length >= 8) {
        alert("Puoi caricare al massimo 8 loghi");
        return prev;
      }

      const objectUrl = URL.createObjectURL(file);
      blobUrlsRef.current.push(objectUrl);

      const newLogo = {
        id: `logo-${Date.now()}`,
        src: objectUrl,
        position: { x: NEWS_LAYOUT.LOGO.startX, y: NEWS_LAYOUT.LOGO.startY },
        scale: { scaleX: NEWS_LAYOUT.LOGO.defaultScaleX, scaleY: NEWS_LAYOUT.LOGO.defaultScaleY },
        blurRadius: 0
      };

      setSelectedLogo(newLogo.id);
      setSelectedBackground(null);
      return [newLogo, ...prev];
    });

    e.target.value = null;
  }, []);

  const removeBackgroundImage = useCallback((id) => {
    setBackgroundImages(prev => {
      const imageToRemove = prev.find(image => image.id === id);
      if (imageToRemove && imageToRemove.src && imageToRemove.src.startsWith('blob:')) {
        URL.revokeObjectURL(imageToRemove.src);
        blobUrlsRef.current = blobUrlsRef.current.filter(url => url !== imageToRemove.src);
      }
      return prev.filter(image => image.id !== id);
    });
    setSelectedBackground(prev => prev === id ? null : prev);
  }, []);

  const removeLogo = useCallback((id) => {
    setLogos(prev => {
      const logoToRemove = prev.find(logo => logo.id === id);
      if (logoToRemove && logoToRemove.src && logoToRemove.src.startsWith('blob:')) {
        URL.revokeObjectURL(logoToRemove.src);
        blobUrlsRef.current = blobUrlsRef.current.filter(url => url !== logoToRemove.src);
      }
      return prev.filter(logo => logo.id !== id);
    });
    setSelectedLogo(prev => prev === id ? null : prev);
  }, []);

  const reorderItems = useCallback((dragIndex, hoverIndex, items, setter) => {
    const updatedItems = [...items];
    const draggedItem = updatedItems[dragIndex];
    updatedItems.splice(dragIndex, 1);
    updatedItems.splice(hoverIndex, 0, draggedItem);
    setter(updatedItems);
  }, []);

  const updateItemPosition = useCallback((id, newPosition, items_ignored, setter) => {
    setter(prevItems => {
      const itemIndex = prevItems.findIndex(item => item.id === id);
      if (itemIndex === -1) return prevItems;
      const updatedItems = [...prevItems];
      updatedItems[itemIndex] = { ...updatedItems[itemIndex], position: newPosition };
      return updatedItems;
    });
  }, []);

  const moveElement = useCallback((item, setter, items_ignored, direction, step = 2) => {
    setter(prevItems => {
      const itemIndex = prevItems.findIndex(i => i.id === item.id);
      if (itemIndex === -1) return prevItems;
      const updatedItems = [...prevItems];
      const updatedItem = { ...updatedItems[itemIndex] };
      if (direction === 'left') updatedItem.position.x -= step;
      else if (direction === 'right') updatedItem.position.x += step;
      else if (direction === 'up') updatedItem.position.y -= step;
      else if (direction === 'down') updatedItem.position.y += step;
      updatedItems[itemIndex] = updatedItem;
      return updatedItems;
    });
  }, []);

  const resizeElement = useCallback((item, setter, items_ignored, type, step = 0.02) => {
    setter(prevItems => {
      const itemIndex = prevItems.findIndex(i => i.id === item.id);
      if (itemIndex === -1) return prevItems;
      const updatedItems = [...prevItems];
      const updatedItem = { ...updatedItems[itemIndex], scale: { ...updatedItems[itemIndex].scale } };
      if (type === 'increase') {
        updatedItem.scale.scaleX += step;
        updatedItem.scale.scaleY += step;
      } else {
        updatedItem.scale.scaleX = Math.max(0.1, updatedItem.scale.scaleX - step);
        updatedItem.scale.scaleY = Math.max(0.1, updatedItem.scale.scaleY - step);
      }
      updatedItems[itemIndex] = updatedItem;
      return updatedItems;
    });
  }, []);

  const copyItemTransform = useCallback((id, type) => {
    const list = type === 'logo' ? logos : backgroundImages;
    const item = list.find(i => i.id === id);
    if (item) {
      setCopiedTransform({
        position: { ...item.position },
        scale: { ...item.scale },
        rotation: item.rotation || 0,
        blurRadius: item.blurRadius || 0
      });
    }
  }, [backgroundImages, logos]);

  const pasteItemTransform = useCallback((id, type) => {
    if (!copiedTransform) return;
    const setter = type === 'logo' ? setLogos : setBackgroundImages;
    setter(items => items.map(item => {
      if (item.id !== id) return item;
      return {
        ...item,
        position: { ...copiedTransform.position },
        scale: { ...copiedTransform.scale },
        rotation: copiedTransform.rotation || 0,
        blurRadius: copiedTransform.blurRadius || 0
      };
    }));
  }, [copiedTransform]);

  const applyTransformToAll = useCallback((id, type) => {
    const list = type === 'logo' ? logos : backgroundImages;
    const source = list.find(i => i.id === id);
    if (!source) return;

    const transformToApply = {
      position: { ...source.position },
      scale: { ...source.scale },
      rotation: source.rotation || 0,
      blurRadius: source.blurRadius || 0
    };

    const setter = type === 'logo' ? setLogos : setBackgroundImages;
    setter(items => items.map(item => ({
      ...item,
      position: { ...transformToApply.position },
      scale: { ...transformToApply.scale },
      rotation: transformToApply.rotation,
      blurRadius: transformToApply.blurRadius
    })));
  }, [backgroundImages, logos]);

  return {
    backgroundImages, setBackgroundImages,
    logos, setLogos,
    selectedBackground, setSelectedBackground,
    selectedLogo, setSelectedLogo,
    handleBackgroundUpload, handleLogoUpload,
    removeBackgroundImage, removeLogo,
    reorderItems,
    updateItemPosition, moveElement, resizeElement,
    copiedTransform, copyItemTransform, pasteItemTransform, applyTransformToAll
  };
}
