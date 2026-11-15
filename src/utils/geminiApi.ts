/**
 * Tiện ích gọi Google Gemini Vision API với cơ chế tự động thử model xịn nhất (free)
 * và hạ cấp dần (auto fallback) nếu gặp lỗi model not found / unsupported / rate limit.
 * Hỗ trợ các dòng model mới nhất (gemini-2.0-flash, 2.5, 3.5...) và cho phép tự nhập model tùy chỉnh.
 */

export const FALLBACK_GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-exp',
  'gemini-2.5-flash',
  'gemini-3.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
  'gemini-2.0-flash-thinking-exp',
  'gemini-1.5-pro-latest',
  'gemini-1.5-pro',
];

/**
 * Lấy danh sách các model khả dụng cho API Key từ Google AI Studio (ListModels API)
 */
export async function getAvailableGeminiModels(apiKey: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.models || !Array.isArray(data.models)) return [];

    // Lọc các model hỗ trợ generateContent và thuộc dòng gemini
    const supported: string[] = data.models
      .filter((m: any) => {
        const methods: string[] = m.supportedGenerationMethods || [];
        return (
          methods.includes('generateContent') &&
          typeof m.name === 'string' &&
          m.name.includes('gemini')
        );
      })
      .map((m: any) => m.name.replace(/^models\//, ''));

    // Sắp xếp các model theo độ ưu tiên: model nào nằm trong FALLBACK_GEMINI_MODELS xếp trước
    supported.sort((a: string, b: string) => {
      const idxA = FALLBACK_GEMINI_MODELS.indexOf(a);
      const idxB = FALLBACK_GEMINI_MODELS.indexOf(b);
      const scoreA = idxA !== -1 ? idxA : 999;
      const scoreB = idxB !== -1 ? idxB : 999;
      return scoreA - scoreB;
    });

    return supported;
  } catch {
    return [];
  }
}

/**
 * Gọi Gemini Vision tự động thử model xịn nhất và hạ dần nếu gặp lỗi
 */
export async function generateContentWithGeminiFallback({
  apiKey,
  prompt,
  base64Data,
  mimeType,
  images,
  preferredModel,
  onStatusUpdate,
}: {
  apiKey: string;
  prompt: string;
  base64Data?: string;
  mimeType?: string;
  images?: { base64Data: string; mimeType: string }[];
  preferredModel?: string;
  onStatusUpdate?: (status: string) => void;
}): Promise<{ text: string; modelUsed: string }> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    throw new Error('Vui lòng nhập API Key Gemini (lấy miễn phí tại aistudio.google.com).');
  }

  // 1. Thử lấy danh sách model thực tế được hỗ trợ bởi API key của người dùng
  onStatusUpdate?.('Đang kết nối Google AI Studio để kiểm tra model khả dụng...');
  let candidateModels: string[] = [];
  try {
    const onlineModels = await getAvailableGeminiModels(cleanKey);
    if (onlineModels.length > 0) {
      candidateModels = onlineModels;
    }
  } catch {
    // Bỏ qua lỗi listModels nếu mạng chặn
  }

  // Nếu không lấy được qua ListModels, dùng danh sách fallback mặc định
  if (candidateModels.length === 0) {
    candidateModels = [...FALLBACK_GEMINI_MODELS];
  }

  // Nếu người dùng chọn hoặc tự nhập một model cụ thể (ưu tiên số 1)
  const cleanPreferred = preferredModel?.trim();
  if (cleanPreferred && cleanPreferred !== 'auto') {
    candidateModels = [
      cleanPreferred,
      ...candidateModels.filter((m) => m.toLowerCase() !== cleanPreferred.toLowerCase()),
    ];
  } else {
    // Nếu trước đó đã có model quét thành công được lưu trong localStorage, ưu tiên đưa lên đầu
    const lastWorkingModel = localStorage.getItem('pt_working_gemini_model');
    if (lastWorkingModel && candidateModels.includes(lastWorkingModel)) {
      candidateModels = [
        lastWorkingModel,
        ...candidateModels.filter((m) => m !== lastWorkingModel),
      ];
    }
  }

  let lastErrorMsg = '';
  const attemptedModels: string[] = [];

  for (const model of candidateModels) {
    attemptedModels.push(model);
    onStatusUpdate?.(`Đang thử quét với AI model: ${model}...`);

    // Chuẩn bị danh sách image parts hỗ trợ đơn ảnh hoặc đa ảnh (cuộn trang)
    const imageParts =
      images && images.length > 0
        ? images.map((img) => ({
            inlineData: {
              mimeType: img.mimeType || 'image/jpeg',
              data: img.base64Data,
            },
          }))
        : base64Data
        ? [
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: base64Data,
              },
            },
          ]
        : [];

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }, ...imageParts],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        // Lỗi từ model này (ví dụ 404 not found, không hỗ trợ, hoặc hết quota) -> Lưu lại và thử model tiếp theo
        lastErrorMsg = data.error.message || `Lỗi model ${model}`;
        continue;
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        // Thành công! Lưu model này lại để lần sau quét nhanh hơn
        localStorage.setItem('pt_working_gemini_model', model);
        return { text, modelUsed: model };
      }
    } catch (err: any) {
      lastErrorMsg = err?.message || `Lỗi kết nối tới model ${model}`;
      continue;
    }
  }

  throw new Error(
    `Không thể phân tích ảnh qua các model đã thử (${attemptedModels.join(', ')}). Chi tiết lỗi: ${lastErrorMsg}`
  );
}
