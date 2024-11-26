import { Stack, Button, TextInput, Slider, Checkbox, Group, Text } from "@mantine/core";
import { useState } from "react";
import DropdownContent from "../Dropdown/DropdownContent";
import DropdownButton from "../Dropdown/DropdownButton";
import { useAppContext } from "../AppLayout";

export default function SpectraInputs() {
  const [open, setOpen] = useState(false);
  const {
    spectralPeaks,
    setSpectralPeaks,
    activeCones,
    setActiveCones,
    omitBetaBand,
    setOmitBetaBand,
    isMaxBasis,
    setIsMaxBasis,
    wavelengthSampleResolution,
    setWavelengthSampleResolution,
    submitSwitch,
    setSubmitSwitch,
    wavelengthBounds,
    setWavelengthBounds,
  } = useAppContext();

  const handleSpectralPeaksChange = (name: string, value: number) => {
    setSpectralPeaks((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleActiveConesChange = (name: string) => {
    setActiveCones((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
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

    console.log("Wavelength Bounds:", wavelengthBounds);
    console.log("Cone Peaks:", spectralPeaks);
    console.log("Active Cones:", activeCones);
    console.log("Omit Beta Band:", omitBetaBand);
    console.log("Is Max Basis:", isMaxBasis);
    console.log("Wavelength Sample Resolution:", wavelengthSampleResolution);
  };

  return (
    <div>
      <DropdownButton open={open} setOpen={setOpen} leftDropdown={false} />
      <DropdownContent open={open} width={400}>
        <Stack gap="m">
          <form onSubmit={handleSubmit}>
            <TextInput
              label="Minimum Wavelength"
              placeholder="Minimum Wavelength"
              name="min"
              type="number"
              value={wavelengthBounds.min || ""} // Avoid undefined
              onChange={handleBoundsInputChange}
              required
            />
            <TextInput
              label="Maximum Wavelength"
              placeholder="Maximum Wavelength"
              name="max"
              type="number"
              value={wavelengthBounds.max || ""} // Avoid undefined
              onChange={handleBoundsInputChange}
              required
            />

            <Text weight={500} fw={500} size="md" mb="sm">
              Spectral Peaks (nm)
            </Text>
            {["isCone1Active", "isCone2Active", "isCone3Active", "isCone4Active"].map(
              (coneKey, index) => (
                <Group key={coneKey} position="apart" mb="sm">
                  <Text size="sm" style={{ minWidth: "0px" }}>
                    {`${spectralPeaks[`peakWavelength${index + 1}`] || "N/A"} nm`}
                  </Text>
                  <Slider
                    label={null}
                    value={spectralPeaks[`peakWavelength${index + 1}`] || "N/A"}
                    onChange={(value) =>
                      handleSpectralPeaksChange(`peakWavelength${index + 1}`, value)
                    }
                    min={300}
                    max={800}
                    step={1}
                    disabled={!activeCones[coneKey]}
                    style={{ flexGrow: 1 }}
                  />
                  <Checkbox
                    checked={activeCones[coneKey] || false}
                    onChange={() => handleActiveConesChange(coneKey)}
                  />
                </Group>
              )
            )}
            <Checkbox
              label="Omit Beta Band"
              checked={omitBetaBand}
              onChange={(event) => setOmitBetaBand(event.currentTarget.checked)}
              mb="sm"
            />
            <Checkbox
              label="Max Basis"
              checked={isMaxBasis}
              onChange={(event) => setIsMaxBasis(event.currentTarget.checked)}
              mb="sm"
            />
            <TextInput
              label="Wavelength Sample Resolution"
              placeholder="Enter Resolution"
              type="number"
              value={wavelengthSampleResolution || ""} // Avoid undefined
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
