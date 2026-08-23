import { createResumeJobAdCheckerSocialImage, resumeJobAdCheckerSocialImageSize } from "@/lib/resumeJobAdCheckerSocialImage";

export const alt = "Hoju Compass 무료 이력서·Job Ad 공고 맞춤 근거 점검기";
export const size = resumeJobAdCheckerSocialImageSize;
export const contentType = "image/png";

export default function ResumeJobAdCheckerOpenGraphImage() {
  return createResumeJobAdCheckerSocialImage();
}
