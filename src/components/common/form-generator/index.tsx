import {
  ErrorMessage,
  FieldValuesFromFieldErrors,
} from "@hookform/error-message";

import {
  FieldErrors,
  FieldName,
  FieldValues,
  Path,
  UseFormRegister,
} from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { LoaderRenderer } from "@/components/common/loader-renderer";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle, Loader2 } from "lucide-react";
import HostRenderer from "../host-renderer";

type TextareaAction = {
  label: string;
  loadingLabel?: string;
  onClick: () => void;
  position: "bottom-left" | "bottom-right";
  isPending?: boolean;
};

type TextareaConfig = {
  wrapperClassName?: string;
  maxLength?: number;
  showCount?: boolean;
  countPosition?: "bottom-left" | "bottom-right";
  action?: TextareaAction;
  resize?: boolean;
  tooltip?: string;
};

type LabelConfig = {
  top?: string;
  bottom?: string;
};

type StepLabel = {
  value: number;
  topLabel?: string;
  bottomLabel?: string;
};

type SliderConfig = {
  min: number;
  max: number;
  step?: number;
  showMinLabel?: boolean;
  showMaxLabel?: boolean;
  minLabel?: string | LabelConfig;
  maxLabel?: string | LabelConfig;
  stepLabels?: StepLabel[];
  fixedValues?: { value: number; label: string }[];
  tooltip?: string;
  formatValue?: (value: number) => string;
  showCurrentValue?: boolean;
};

export type FormGeneratorProps<T extends FieldValues> = {
  id: string;
  inputType: "select" | "input" | "textarea" | "checkbox" | "switch" | "slider";
  name: Path<T>;
  errors: FieldErrors<T>;
  type?: HTMLInputElement["type"];
  options?: { value: string; label: string; id: string }[];
  placeholder?: string;
  label?: string;
  lines?: number;
  register: UseFormRegister<T>;
  setValue: (name: keyof T, value: any) => void;
  watch: (_name: string, _defaultValue: any) => any;
  className?: string;
  autoComplete?: HTMLInputElement["autocomplete"];
  textareaConfig?: TextareaConfig;
  defaultValue?: string;
  sliderConfig?: SliderConfig;
};

export type FormGeneratorType<T extends FieldValues> = Omit<
  FormGeneratorProps<T>,
  "register" | "setValue" | "errors" | "watch"
>;

const FormGenerator = <T extends FieldValues>({
  id,
  inputType,
  options,
  label,
  placeholder,
  register,
  setValue,
  name,
  errors,
  type = "text",
  lines,
  watch,
  className,
  autoComplete,
  textareaConfig,
  defaultValue,
  sliderConfig,
}: FormGeneratorProps<T>) => {
  const renderErrorMessage = () => (
    <ErrorMessage
      errors={errors}
      name={
        name as unknown as FieldName<FieldValuesFromFieldErrors<FieldErrors<T>>>
      }
      render={({ message }) =>
        message !== "Required" && (
          <p className="mt-2 text-red-400">
            <HostRenderer content={message} />
          </p>
        )
      }
    />
  );
  const renderInput = () => (
    <Label
      className="flex flex-col items-center justify-center gap-2 text-center"
      htmlFor={`input-${id}`}
    >
      {label}
      <Input
        id={`input-${id}`}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={cn(
          "bg-themeBlack border-themeGray text-themeTextGray",
          className
        )}
        {...register(name)}
      />
      {renderErrorMessage()}
    </Label>
  );

  const renderSelect = () => {
    const watchSelect = watch(name, defaultValue || "");
    return (
      <Label htmlFor={`select-${id}`} className="flex flex-col gap-2">
        {label}
        <Select
          onValueChange={(value) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            value && setValue(name, value);
          }}
          value={watchSelect}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options?.map((option) => (
              <SelectItem value={option.value} key={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {renderErrorMessage()}
      </Label>
    );
  };

  const renderTooltip = (content: string) => (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <span
            className="cursor-help"
            onClick={(e) => e.preventDefault()}
            tabIndex={-1}
          >
            <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-500" />
          </span>
        </TooltipTrigger>
        <TooltipContent
          sideOffset={4}
          className="max-w-xs select-text break-words rounded-md bg-gray-900 px-3 py-2 text-sm text-gray-50"
        >
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const renderTextarea = () => {
    const watchTextarea = watch(name, "");
    const currentLength = watchTextarea?.length || 0;

    const renderBottomContent = () => {
      const showCount = textareaConfig?.showCount;
      const showAction = textareaConfig?.action;
      const countPosition = textareaConfig?.countPosition || "bottom-right";

      if (!showCount && !showAction) return null;

      return (
        <div className="flex items-end justify-between bg-background p-2">
          <div className="flex items-center gap-2">
            {showCount && countPosition === "bottom-left" && (
              <span className="text-xs text-muted-foreground">
                {currentLength}/{textareaConfig.maxLength}
              </span>
            )}
            {showAction?.position === "bottom-left" && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={textareaConfig.action?.onClick}
                className={cn(
                  "h-8 px-3 text-xs",
                  textareaConfig.action?.isPending && "cursor-not-allowed"
                )}
                disabled={textareaConfig.action?.isPending}
              >
                <LoaderRenderer
                  status={
                    textareaConfig.action?.isPending ? "loading" : "default"
                  }
                  statuses={{
                    default: { icon: null, text: textareaConfig.action?.label },
                    loading: {
                      icon: <Loader2 className="h-4 w-4 animate-spin" />,
                      text:
                        textareaConfig.action?.loadingLabel ||
                        textareaConfig.action?.label,
                    },
                  }}
                />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {showCount && countPosition === "bottom-right" && (
              <span className="text-xs text-muted-foreground">
                {currentLength}/{textareaConfig.maxLength}
              </span>
            )}
            {showAction?.position === "bottom-right" && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={textareaConfig.action?.onClick}
                className={cn(
                  "h-8 px-3 text-xs",
                  textareaConfig.action?.isPending && "cursor-not-allowed"
                )}
                disabled={textareaConfig.action?.isPending}
              >
                <LoaderRenderer
                  status={
                    textareaConfig.action?.isPending ? "loading" : "default"
                  }
                  statuses={{
                    default: { icon: null, text: textareaConfig.action?.label },
                    loading: {
                      icon: <Loader2 className="h-4 w-4 animate-spin" />,
                      text:
                        textareaConfig.action?.loadingLabel ||
                        textareaConfig.action?.label,
                    },
                  }}
                />
              </Button>
            )}
          </div>
        </div>
      );
    };

    return (
      <Label className="flex flex-col gap-2" htmlFor={`input-${id}`}>
        <div className="flex items-center gap-2">
          <span>{label}</span>
          {textareaConfig?.tooltip && renderTooltip(textareaConfig.tooltip)}
        </div>
        <div
          className={cn(
            "flex flex-col overflow-hidden rounded-md border focus-within:outline focus-within:outline-1 focus-within:outline-primary",
            textareaConfig?.resize ? "resize-y" : "resize-none",
            textareaConfig?.showCount || textareaConfig?.action
              ? "min-h-28"
              : "",
            textareaConfig?.wrapperClassName
          )}
        >
          <Textarea
            className={cn(
              "w-full flex-1 resize-none rounded-none border-0 bg-transparent",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              className
            )}
            id={`input-${id}`}
            placeholder={placeholder}
            maxLength={textareaConfig?.maxLength}
            {...register(name)}
            onChange={(e) => {
              setValue(name, e.target.value);
            }}
            rows={lines}
          />

          {renderBottomContent()}
        </div>
        {renderErrorMessage()}
      </Label>
    );
  };

  const renderCheckbox = () => {
    const watchCheckbox = watch(name, true);
    return (
      <Label className="flex items-center gap-2" htmlFor={`checkbox-${id}`}>
        <Checkbox
          id={`checkbox-${id}`}
          {...register(name)}
          checked={watchCheckbox}
          onCheckedChange={(checked) => setValue(name, checked)}
        />
        {label}
      </Label>
    );
  };

  const renderSwitch = () => {
    const watchSwitch = watch(name, false);

    return (
      <Label
        className="flex items-center justify-between gap-2"
        htmlFor={`switch-${id}`}
      >
        <span className="flex-shrink-0">{label}</span>
        <Switch
          id={`switch-${id}`}
          checked={watchSwitch}
          onCheckedChange={(checked) => {
            setValue(name, checked);
          }}
        />
      </Label>
    );
  };

  const renderSlider = () => {
    const watchSlider = watch(name, 0);

    const hasDoubleLabel =
      (typeof sliderConfig?.minLabel === "object" &&
        sliderConfig?.minLabel.bottom) ||
      (typeof sliderConfig?.maxLabel === "object" &&
        sliderConfig?.maxLabel.bottom);

    const hasStepLabels =
      !!sliderConfig?.stepLabels && sliderConfig.stepLabels.length > 0;

    const renderStepLabels = () => {
      if (!sliderConfig?.stepLabels) return null;

      return (
        <div className="absolute -top-6 flex w-full justify-between">
          {sliderConfig.stepLabels.map((step) => {
            const position =
              ((step.value - (sliderConfig.min || 0)) /
                ((sliderConfig.max || 1) - (sliderConfig.min || 0))) *
              100;
            let style: React.CSSProperties = {};

            if (position <= 0) {
              style = { left: "0%", transform: "translateX(0)" };
            } else if (position >= 100) {
              style = { right: "0%", transform: "translateX(0)" };
            } else {
              style = { left: `${position}%`, transform: "translateX(-50%)" };
            }

            return (
              <div
                key={step.value}
                className="absolute flex flex-col items-center"
                style={style}
              >
                {step.topLabel && (
                  <span className="text-xs text-muted-foreground">
                    {step.topLabel}
                  </span>
                )}
                {step.bottomLabel && (
                  <div className="absolute top-8 text-xs text-muted-foreground">
                    {step.bottomLabel}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    };

    const renderLabel = () => (
      <div className="flex items-center gap-2">
        <span>{label}</span>
        {sliderConfig?.tooltip && renderTooltip(sliderConfig.tooltip)}
      </div>
    );

    const renderEdgeLabel = (label?: string | LabelConfig) => {
      if (!label) return null;

      if (typeof label === "string") {
        return (
          <div
            className={cn(
              "min-w-[40px] text-sm",
              hasDoubleLabel && "self-center"
            )}
          >
            {label}
          </div>
        );
      }

      return (
        <div className="flex min-w-[40px] flex-col items-center">
          {label.top && <div className="text-sm">{label.top}</div>}
          {label.bottom && (
            <div className="text-xs text-muted-foreground">{label.bottom}</div>
          )}
        </div>
      );
    };

    return (
      <div
        className={cn(
          "flex w-full flex-col",
          hasStepLabels ? "gap-6" : "gap-2"
        )}
      >
        {label && renderLabel()}
        <div className="flex items-center gap-4">
          {sliderConfig?.showMinLabel && (
            <div
              className={cn(
                "flex",
                hasDoubleLabel ? "h-[40px] items-start" : "items-center"
              )}
            >
              {renderEdgeLabel(sliderConfig.minLabel || `${sliderConfig?.min}`)}
            </div>
          )}

          <div
            className={cn("relative flex-1", hasDoubleLabel && "self-center")}
          >
            {sliderConfig?.fixedValues && (
              <div className="absolute -top-6 flex w-full justify-between">
                {sliderConfig.fixedValues.map((value) => (
                  <span key={value.value} className="text-xs">
                    {value.label}
                  </span>
                ))}
              </div>
            )}
            {renderStepLabels()}
            {sliderConfig?.showCurrentValue && (
              <div
                className="absolute -top-6 text-xs"
                style={{
                  left: `${((watchSlider - (sliderConfig.min || 0)) / ((sliderConfig.max || 100) - (sliderConfig.min || 0))) * 100}%`,
                  transform: "translateX(-50%)",
                }}
              >
                {sliderConfig.formatValue
                  ? sliderConfig.formatValue(watchSlider)
                  : watchSlider}
              </div>
            )}

            <Slider
              value={[watchSlider]}
              min={sliderConfig?.min || 0}
              max={sliderConfig?.max || 100}
              step={
                sliderConfig?.step ||
                (sliderConfig?.fixedValues ? undefined : 1)
              }
              onValueChange={(value) => setValue(name, value[0])}
              {...(sliderConfig?.fixedValues && {
                marks: sliderConfig.fixedValues.map((v) => v.value),
              })}
            />
          </div>

          {sliderConfig?.showMaxLabel && (
            <div
              className={cn(
                "flex",
                hasDoubleLabel ? "h-[40px] items-start" : "items-center"
              )}
            >
              {renderEdgeLabel(sliderConfig.maxLabel || `${sliderConfig?.max}`)}
            </div>
          )}
        </div>
        {renderErrorMessage()}
      </div>
    );
  };

  switch (inputType) {
    case "input":
      return renderInput();
    case "select":
      return renderSelect();
    case "textarea":
      return renderTextarea();
    case "checkbox":
      return renderCheckbox();
    case "switch":
      return renderSwitch();
    case "slider":
      return renderSlider();
    default:
      return null;
  }
};

export default FormGenerator;
