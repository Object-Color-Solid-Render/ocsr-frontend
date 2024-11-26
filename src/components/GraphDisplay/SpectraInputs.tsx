import { Stack, Button, TextInput, Slider, Checkbox, Group, Text } from "@mantine/core";
import { useState } from "react";
import DropdownContent from "../Dropdown/DropdownContent";
import DropdownButton from "../Dropdown/DropdownButton";
import { useAppContext } from "../AppLayout";

export default function SpectraInputs() {
  const [open, setOpen] = useState(false);
  const {
    conePeaks,
    setConePeaks,
    submitSwitch,
    setSubmitSwitch,
    wavelengthBounds,
    setWavelengthBounds,
  } = useAppContext();

  // State for sliders and their toggles
  const [sliderValues, setSliderValues] = useState({
    peakWavelength1: 400,
    peakWavelength2: 500,
    peakWavelength3: 600,
    peakWavelength4: 700,
  });

  const [sliderActive, setSliderActive] = useState({
    peakWavelength1: true,
    peakWavelength2: true,
    peakWavelength3: true,
    peakWavelength4: true,
  });

  // State for additional fields
  const [omitBetaBand, setOmitBetaBand] = useState(false);
  const [isMaxBasis, setIsMaxBasis] = useState(false);
  const [wavelengthSampleResolution, setWavelengthSampleResolution] = useState(10);

  const handleSliderChange = (name: string, value: number) => {
    setSliderValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggleChange = (name: string) => {
    setSliderActive((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleConeInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setConePeaks({
      ...conePeaks,
      [name]: Number(value),
    });
  };

  const handleBoundsInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setWavelengthBounds({
      ...wavelengthBounds,
      [name]: Number(value),
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitSwitch(-1 * submitSwitch);
    console.log("OLD, TODO REMOVE AND DONT USE, Cone Peaks:", conePeaks); // DO NOT USE THIS, USE SLIDER VALUES INSTEAD
    console.log("Wavelength Bounds:", wavelengthBounds);
    console.log("Cone Peaks:", sliderValues);
    console.log("Active Cones:", sliderActive);
    console.log("Omit Beta Band:", omitBetaBand);
    console.log("Is Max Basis:", isMaxBasis);
    console.log("Wavelength Sample Resolution:", wavelengthSampleResolution);
  };

  return (
    <div>
      <DropdownButton open={open} setOpen={setOpen} leftDropdown={false} />
      <DropdownContent open={open}>
        <Stack gap="m">
          <form onSubmit={handleSubmit}>
            <TextInput
              label="Minimum Wavelength"
              placeholder="Minimum Wavelength"
              name="min"
              type="number"
              value={wavelengthBounds.min}
              onChange={handleBoundsInputChange}
              required
            />
            <TextInput
              label="Maximum Wavelength"
              placeholder="Maximum Wavelength"
              name="max"
              type="number"
              value={wavelengthBounds.max}
              onChange={handleBoundsInputChange}
              required
            />

            <Text weight={500} fw={500} size="md" mb="sm">
              Spectral Peaks (nm)
            </Text>

            {["peakWavelength1", "peakWavelength2", "peakWavelength3", "peakWavelength4"].map(
              (slider, index) => (
                <Group key={slider} position="apart" mb="sm">
                
                  <Slider
                    label={(value) => `${value} nm`}
                    value={sliderValues[slider as keyof typeof sliderValues]}
                    onChange={(value) => handleSliderChange(slider, value)}
                    min={300}
                    max={800}
                    step={1}
                    disabled={!sliderActive[slider as keyof typeof sliderActive]}
                    style={{ flexGrow: 1 }}
                  />
                  <Checkbox
                    checked={sliderActive[slider as keyof typeof sliderActive]}
                    onChange={() => handleToggleChange(slider)}
                  />
                </Group>
              )
            )}

            {/* Additional Fields */}
            <Checkbox
              label="Omit Beta Band"
              checked={omitBetaBand}
              onChange={(event) => setOmitBetaBand(event.currentTarget.checked)}
              mb="sm"
            />
            <Checkbox
              label="Is Max Basis"
              checked={isMaxBasis}
              onChange={(event) => setIsMaxBasis(event.currentTarget.checked)}
              mb="sm"
            />
            <TextInput
              label="Wavelength Sample Resolution"
              placeholder="Enter Resolution"
              type="number"
              value={wavelengthSampleResolution}
              onChange={(event) => setWavelengthSampleResolution(Number(event.target.value))}
              required
              mb="sm"
            />

            <Button type="submit" fullWidth>
              Submit
            </Button>
          </form>
        </Stack>
      </DropdownContent>
    </div>
  );
}
