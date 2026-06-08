import re

with open('f:/cronacheapp/src/NewsEditor/NewsEditor.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    "import React, { useState, useRef, useEffect } from 'react';",
    "import React, { useState, useRef, useEffect, useCallback } from 'react';\nimport { useCanvasElements } from '../hooks/useCanvasElements';\nimport { useTextEditor } from '../hooks/useTextEditor';"
)

# 2. State replacements
state_start_idx = content.find('  // States for text content')
state_end_idx = content.find('  // Passi unificati per controlli UI')

new_state = '''  const {
    backgroundImages, setBackgroundImages,
    logos, setLogos,
    selectedBackground, setSelectedBackground,
    selectedLogo, setSelectedLogo,
    handleBackgroundUpload, handleLogoUpload,
    removeBackgroundImage, removeLogo,
    reorderItems
  } = useCanvasElements();

  const {
    title, setTitle,
    text, setText,
    richText, setRichText,
    titleColor, setTitleColor,
    textColor, setTextColor,
    titleFont, setTitleFont,
    textFont, setTextFont,
    titleFontSize, setTitleFontSize,
    textFontSize, setTextFontSize,
    titlePosition, setTitlePosition,
    textPosition, setTextPosition,
    textAboveImages, setTextAboveImages,
    handleTextChange
  } = useTextEditor();

  const [backgroundImage, setBackgroundImage] = useState('/sfondoNotizie/sfumatura.png');
  const [background] = useImage(backgroundImage);
  const [showSelection, setShowSelection] = useState(true);
  const [busyFilter, setBusyFilter] = useState(false);
  const [activeTab, setActiveTab] = useState('text');

'''

if state_start_idx != -1 and state_end_idx != -1:
    content = content[:state_start_idx] + new_state + content[state_end_idx:]

# 3. handleBackgroundChange
content = content.replace(
    '''  const handleBackgroundChange = (e) => {
    setBackgroundImage(e.target.value);  // Remove path manipulation
  };''',
    '''  const handleBackgroundChange = useCallback((e) => {
    setBackgroundImage(e.target.value);
  }, []);'''
)

# 4. delete handleTextChange through removeLogo
text_change_start = content.find('  const handleTextChange = () => {')
move_element_start = content.find('  const moveElement = (item, setter, items, direction) => {')

proxy_code = '''  const handleTextChangeProxy = useCallback(() => {
    handleTextChange(textContainerRef);
  }, [handleTextChange]);

'''

if text_change_start != -1 and move_element_start != -1:
    content = content[:text_change_start] + proxy_code + content[move_element_start:]

# 5. wrap moveElement, resizeElement, updateItemPosition
content = content.replace(
    '''  const moveElement = (item, setter, items, direction) => {''',
    '''  const moveElement = useCallback((item, setter, items, direction) => {'''
).replace(
    '''    setter(updatedItems);
  };

  const resizeElement = (item, setter, items, type) => {''',
    '''    setter(updatedItems);
  }, []);

  const resizeElement = useCallback((item, setter, items, type) => {'''
).replace(
    '''    setter(updatedItems);
  };

  const updateItemPosition = (id, newPosition, items, setter) => {''',
    '''    setter(updatedItems);
  }, []);

  const updateItemPosition = useCallback((id, newPosition, items, setter) => {'''
).replace(
    '''    setter(updatedItems);
  };

''',
    '''    setter(updatedItems);
  }, []);

'''
)

# 6. Filters
content = content.replace(
    '''  const applyAcrSportToSelectedBackground = async () => {''',
    '''  const applyAcrSportToSelectedBackground = useCallback(async () => {'''
).replace(
    '''      setBackgroundImages(updated);
    } finally {
      setBusyFilter(false);
    }
  };

  const applyUpscaleToSelectedBackground = async () => {''',
    '''      setBackgroundImages(updated);
    } finally {
      setBusyFilter(false);
    }
  }, [selectedBackground, backgroundImages, setBackgroundImages]);

  const applyUpscaleToSelectedBackground = useCallback(async () => {'''
).replace(
    '''    } finally {
      setBusyFilter(false);
    }
  };

  const removeFilterFromSelectedBackground = () => {''',
    '''    } finally {
      setBusyFilter(false);
    }
  }, [selectedBackground, backgroundImages, setBackgroundImages]);

  const removeFilterFromSelectedBackground = useCallback(() => {'''
).replace(
    '''    setBackgroundImages(updated);
  };''',
    '''    setBackgroundImages(updated);
  }, [selectedBackground, backgroundImages, setBackgroundImages]);'''
)

# 7. reorderItems delete (already in hook)
# enlargeTextSize, shrinkTextSize wrap
reorder_start = content.find('  const reorderItems = (dragIndex, hoverIndex, items, setter) => {')
enlarge_start = content.find('  const enlargeTextSize = (setter, step = FONT_STEP) =>')

if reorder_start != -1 and enlarge_start != -1:
    content = content[:reorder_start] + content[enlarge_start:]

content = content.replace(
    '''  const enlargeTextSize = (setter, step = FONT_STEP) =>
    setter(prev => prev + step);
  const shrinkTextSize = (setter, step = FONT_STEP) =>
    setter(prev => Math.max(20, prev - step));''',
    '''  const enlargeTextSize = useCallback((setter, step = FONT_STEP) =>
    setter(prev => prev + step), [FONT_STEP]);
  const shrinkTextSize = useCallback((setter, step = FONT_STEP) =>
    setter(prev => Math.max(20, prev - step)), [FONT_STEP]);'''
)

# 8. downloadImage wrap
content = content.replace(
    '''  const downloadImage = async () => {''',
    '''  const downloadImage = useCallback(async () => {'''
).replace(
    '''    setShowSelection(true);
  };''',
    '''    setShowSelection(true);
  }, []);'''
)

# 9. handleTextChange -> handleTextChangeProxy in NewsCreator
content = content.replace(
    'handleTextChange={handleTextChange}',
    'handleTextChange={handleTextChangeProxy}'
)

with open('f:/cronacheapp/src/NewsEditor/NewsEditor.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
