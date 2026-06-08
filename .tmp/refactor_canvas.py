import re

with open('f:/cronacheapp/src/components/NewsCreatorComp/CanvasNews/CanvasNews.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    "import React, { useEffect, useState, useRef, useCallback } from 'react';",
    "import React, { useEffect, useState, useRef, useCallback, memo } from 'react';"
)

# 2. Memoize BackgroundImage and LogoImage
content = content.replace(
    "const BackgroundImage = ({ bgImage, updateItemPosition, backgroundImages, setBackgroundImages, isSelected = false, onSelect = () => {}, showSelection = true }) => {",
    "const BackgroundImage = memo(({ bgImage, updateItemPosition, backgroundImages, setBackgroundImages, isSelected = false, onSelect = () => {}, showSelection = true }) => {"
)
bg_end = content.find("};\n\n// Componente per i loghi")
content = content[:bg_end] + "});\n\n// Componente per i loghi" + content[bg_end + 33:]

content = content.replace(
    "const LogoImage = ({ logo, updateItemPosition, logos, setLogos, isSelected = false, onSelect = () => {} , showSelection = true }) => {",
    "const LogoImage = memo(({ logo, updateItemPosition, logos, setLogos, isSelected = false, onSelect = () => {} , showSelection = true }) => {"
)
logo_end = content.find("};\n\nfunction CanvasNews({")
content = content[:logo_end] + "});\n\nfunction CanvasNews({" + content[logo_end + 25:]

# 3. Extract RichTextGroup and MultiLineText
rich_text_start = content.find('  // Componenti Rich Text e Multi Line Text')
touch_start = content.find('  // 🔧 MULTI-TOUCH PINCH ZOOM LOGIC')

extracted_components = content[rich_text_start:touch_start]

# We need to remove them from inside CanvasNews and put them outside.
content = content[:rich_text_start] + content[touch_start:]

# Fix RichTextGroup signature
new_rich_text = extracted_components.replace(
    "const RichTextGroup = ({ lines, x, y, fontFamily, fontSize, defaultColor, onClick = () => {} }) => {",
    "const RichTextGroup = memo(({ lines, x, y, fontFamily, fontSize, defaultColor, textScale, ORIGINAL_WIDTH, measureWidth, setTextPosition, onClick = () => {} }) => {"
).replace(
    "  const MultiLineText = ({ text, x, y, fontFamily, fontSize, color, width }) => {",
    "});\n\nconst MultiLineText = memo(({ text, x, y, fontFamily, fontSize, color, width, setTextPosition }) => {"
)
new_rich_text = new_rich_text.strip() + "\n});\n\n"

# Insert outside (before function CanvasNews)
canvas_news_start = content.find('function CanvasNews({')
content = content[:canvas_news_start] + new_rich_text + content[canvas_news_start:]

# 4. Update usage in CanvasNews
content = content.replace(
    '''                  <RichTextGroup
                    lines={richText}
                    x={textPosition.x}
                    y={textPosition.y}
                    fontFamily={textFont}
                    fontSize={textFontSize}
                    defaultColor={textColor}
                    onClick={() => setSelectedText('text')}
                  />''',
    '''                  <RichTextGroup
                    lines={richText}
                    x={textPosition.x}
                    y={textPosition.y}
                    fontFamily={textFont}
                    fontSize={textFontSize}
                    defaultColor={textColor}
                    textScale={textScale}
                    ORIGINAL_WIDTH={ORIGINAL_WIDTH}
                    measureWidth={measureWidth}
                    setTextPosition={setTextPosition}
                    onClick={() => setSelectedText('text')}
                  />'''
).replace(
    '''                  <MultiLineText
                    text={text}
                    fontSize={textFontSize}
                    color={textColor}
                    x={textPosition.x}
                    y={textPosition.y}
                    width={ORIGINAL_WIDTH}
                    fontFamily={textFont}
                  />''',
    '''                  <MultiLineText
                    text={text}
                    fontSize={textFontSize}
                    color={textColor}
                    x={textPosition.x}
                    y={textPosition.y}
                    width={ORIGINAL_WIDTH}
                    fontFamily={textFont}
                    setTextPosition={setTextPosition}
                  />'''
).replace(
    '''                  <RichTextGroup
                    lines={richText}
                    x={textPosition.x}
                    y={textPosition.y}
                    fontFamily={textFont}
                    fontSize={textFontSize}
                    defaultColor={textColor}
                  />''',
    '''                  <RichTextGroup
                    lines={richText}
                    x={textPosition.x}
                    y={textPosition.y}
                    fontFamily={textFont}
                    fontSize={textFontSize}
                    defaultColor={textColor}
                    textScale={textScale}
                    ORIGINAL_WIDTH={ORIGINAL_WIDTH}
                    measureWidth={measureWidth}
                    setTextPosition={setTextPosition}
                  />'''
)

# 5. Export memo
content = content.replace(
    "export default CanvasNews;",
    "export default memo(CanvasNews);"
)

with open('f:/cronacheapp/src/components/NewsCreatorComp/CanvasNews/CanvasNews.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done CanvasNews!')
