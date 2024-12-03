import {
  Stack,
  Button,
  TextInput,
  Slider,
  Checkbox,
  Group,
  Text,
  Select,
} from "@mantine/core";
import { useState, useEffect } from "react";
import DropdownContent from "../Dropdown/DropdownContent";
import DropdownButton from "../Dropdown/DropdownButton";
import { useAppContext } from "../AppLayout";

export default function SpectraInputs() {
  const [open, setOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [dropdownOptions, setDropdownOptions] = useState<string[]>([]);

  const {
    spectralDB,
    spectralPeaks,
    setSpectralPeaks,
    spectralPeaksNew,
    setSpectralPeaksNew,
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

  // Update dropdown options whenever spectralDB changes
  useEffect(() => {
    if (spectralDB) {
      const options = Object.keys(spectralDB);
      setDropdownOptions(options);
    }
  }, [spectralDB]);

  // Update spectral peaks when a species is selected
  
  useEffect(() => {
    if (selectedOption && spectralDB[selectedOption]) {
      const peaks = spectralDB[selectedOption].peaks;
      
      // Update spectral peaks based on available peaks
      const newPeaks = {
        peakWavelength1: peaks[0] || spectralPeaks.peakWavelength1,
        peakWavelength2: peaks[1] || spectralPeaks.peakWavelength2,
        peakWavelength3: peaks[2] || spectralPeaks.peakWavelength3,
        peakWavelength4: peaks[3] || spectralPeaks.peakWavelength4,
      };
      
      setSpectralPeaks(newPeaks);

      // Update active cones based on available peaks
      setActiveCones({
        isCone1Active: peaks[0] != 0,
        isCone2Active: peaks[1] != 0,
        isCone3Active: peaks[2] != 0,
        isCone4Active: peaks[3] != 0,
      });
    }
  }, [selectedOption, spectralDB]);
  

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

    console.log("Selected Species:", selectedOption);
    if (selectedOption) {
      console.log("Species Data:", spectralDB[selectedOption]);
    }
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
            <Text weight={500} fw={500} size="md" mb="sm">
              Select Species
            </Text>
            <Select
              placeholder="Select a species"
              data={dropdownOptions}
              value={selectedOption}
              onChange={setSelectedOption}
              searchable
              nothingFound="No species found"
              dropdownPosition="bottom"
              style={{ marginBottom: "16px" }}
            />

            <TextInput
              label="Minimum Wavelength"
              placeholder="Minimum Wavelength"
              name="min"
              type="number"
              value={wavelengthBounds.min || ""}
              onChange={handleBoundsInputChange}
              required
            />
            <TextInput
              label="Maximum Wavelength"
              placeholder="Maximum Wavelength"
              name="max"
              type="number"
              value={wavelengthBounds.max || ""}
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
                    value={spectralPeaks[`peakWavelength${index + 1}`] || 0}
                    onChange={(value) =>
                      handleSpectralPeaksChange(`peakWavelength${index + 1}`, value)
                    }
                    min={380}
                    max={700}
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
              value={wavelengthSampleResolution || ""}
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