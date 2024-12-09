import {
  Stack,
  Button,
  TextInput,
  Slider,
  Checkbox,
  Group,
  Text,
  Select,
  Drawer,
  Collapse,
  Card,
  Title,
} from '@mantine/core';
import { useState, useEffect } from 'react';
import { useAppContext } from '../AppLayout';
import { IconEdit, IconTrash, IconChevronUp, IconChevronDown } from '@tabler/icons-react';
import { OCSContext } from '../OCSContext';

interface SpectraEntryProps {
  entry: OCSContext;
  index: number;
  entryName: string;
  isEditing: boolean;
  isCollapsed: boolean;
  dropdownOptions: string[];
  spectralDB: any;
  onUpdate: (newEntry: OCSContext, index: number) => void;
  onNameChange: (name: string, index: number) => void;
  onToggleEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onToggleCollapse: (index: number) => void;
}

function SpectraEntry({
  entry,
  index,
  entryName,
  isEditing,
  isCollapsed,
  dropdownOptions,
  spectralDB,
  onUpdate,
  onNameChange,
  onToggleEdit,
  onDelete,
  onToggleCollapse,
}: SpectraEntryProps) {
  const handleSpectralPeaksChange = (name: keyof OCSContext['spectralPeaks'], value: number) => {
    const newEntry = { ...entry };
    newEntry.spectralPeaks[name] = value;
    onUpdate(newEntry, index);
  };

  const handleActiveConesChange = (name: keyof OCSContext['activeCones']) => {
    const newEntry = { ...entry };
    newEntry.activeCones[name] = !newEntry.activeCones[name];
    onUpdate(newEntry, index);
  };

  const handleBoundsInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const newEntry = { ...entry };
    newEntry.wavelengthBounds[name as 'min' | 'max'] = Number(value);
    onUpdate(newEntry, index);
  };

  const handleSpeciesChange = (value: string | null) => {
    const newEntry = { ...entry };
    newEntry.selectedSpecies = value;
    if (value && spectralDB[value]) {
      const peaks = spectralDB[value].peaks;
      newEntry.spectralPeaks = {
        peakWavelength1: peaks[0],
        peakWavelength2: peaks[1],
        peakWavelength3: peaks[2],
        peakWavelength4: peaks[3],
      };
      newEntry.activeCones = {
        isCone1Active: peaks[0] !== 0,
        isCone2Active: peaks[1] !== 0,
        isCone3Active: peaks[2] !== 0,
        isCone4Active: peaks[3] !== 0,
      };
    }
    onUpdate(newEntry, index);
    if (value) {
      onNameChange(value, index);
    }
  };

  return (
    <Card padding="lg" style={{ backgroundColor: '#f5f5f7' }}>
      <Group position="apart" align="center">
        {isEditing ? (
          <TextInput
            value={entryName}
            onChange={(e) => onNameChange(e.target.value, index)}
            onBlur={() => onToggleEdit(index)}
            styles={{ input: { fontSize: '1.25rem', fontWeight: 500 } }}
          />
        ) : (
          <Title order={4} style={{ color: '#1d1d1f' }}>{entryName}</Title>
        )}
        <Group spacing="xs" style={{ marginLeft: 'auto' }}>
          <Button variant="subtle" compact onClick={() => onToggleEdit(index)}>
            <IconEdit size={16} />
          </Button>
          <Button variant="subtle" compact onClick={() => onDelete(index)}>
            <IconTrash size={16} />
          </Button>
          <Button variant="subtle" compact onClick={() => onToggleCollapse(index)}>
            {isCollapsed ? <IconChevronDown size={16} /> : <IconChevronUp size={16} />}
          </Button>
        </Group>
      </Group>
      
      <Collapse in={!isCollapsed}>
        <Text weight={500} size="md" mb="sm">
          Select Species
        </Text>
        <Select
          placeholder="Select a species"
          data={dropdownOptions}
          value={entry.selectedSpecies}
          onChange={handleSpeciesChange}
          searchable
          nothingFound="No species found"
          dropdownPosition="bottom"
          mb="md"
        />

        <Text weight={500} size="md" mb="sm">
          Spectral Peaks (nm)
        </Text>
        {(['isCone1Active', 'isCone2Active', 'isCone3Active', 'isCone4Active'] as const).map(
          (coneKey, coneIndex) => (
            <Group key={coneKey} position="apart" mb="sm">
              <Text size="sm" style={{ minWidth: '60px' }}>
                {`Cone ${coneIndex + 1}`}
              </Text>
              <Slider
                value={
                  entry.spectralPeaks[
                    `peakWavelength${coneIndex + 1}` as keyof OCSContext['spectralPeaks']
                  ]
                }
                onChange={value =>
                  handleSpectralPeaksChange(
                    `peakWavelength${coneIndex + 1}` as keyof OCSContext['spectralPeaks'],
                    value
                  )
                }
                min={380}
                max={700}
                step={1}
                disabled={!entry.activeCones[coneKey]}
                style={{ flexGrow: 1 }}
              />
              <Checkbox
                checked={entry.activeCones[coneKey]}
                onChange={() => handleActiveConesChange(coneKey)}
              />
            </Group>
          )
        )}

        <Checkbox
          label="Max Basis"
          checked={entry.isMaxBasis}
          onChange={event =>
            onUpdate({ ...entry, isMaxBasis: event.currentTarget.checked }, index)
          }
          mb="sm"
        />
      </Collapse>
    </Card>
  );
}

export default function SpectraInputs() {
  const [dropdownOptions, setDropdownOptions] = useState<string[]>([]);
  const { entries, setEntries, spectralDB, submitSwitch, setSubmitSwitch, setFetchTrigger } = useAppContext();
  const [collapsedEntries, setCollapsedEntries] = useState(entries.map(() => false));
  const [isEditingName, setIsEditingName] = useState(entries.map(() => false));

  useEffect(() => {
    if (spectralDB) {
      const options = Object.keys(spectralDB);
      setDropdownOptions(options);
    }
  }, [spectralDB]);

  useEffect(() => {
    if (entries.length === 0) {
      const defaultEntry: OCSContext = {
        wavelengthBounds: { min: 390, max: 700 },
        omitBetaBand: true,
        isMaxBasis: false,
        wavelengthSampleResolution: 20,
        spectralPeaks: {
          peakWavelength1: 455,
          peakWavelength2: 543,
          peakWavelength3: 566,
          peakWavelength4: 560,
        },
        activeCones: {
          isCone1Active: true,
          isCone2Active: true,
          isCone3Active: true,
          isCone4Active: false,
        },
        selectedSpecies: null,
        entryName: 'New OCS', // Add entryName property
      };
      setEntries([defaultEntry]);
    }
  }, [entries, setEntries]);

  const handleUpdateEntry = (newEntry: OCSContext, index: number) => {
    setEntries(prev => {
      const newEntries = [...prev];
      newEntries[index] = newEntry;
      return newEntries;
    });
  };

  const handleDeleteEntry = (index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
    setCollapsedEntries(prev => prev.filter((_, i) => i !== index));
    setIsEditingName(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (entries.length > 0) {
      setFetchTrigger(true);
      setSubmitSwitch(-1 * submitSwitch);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ height: '100%' }}>
      <Group position="apart" mb="md">
        <Button type="submit">Submit</Button>
        <Button
          variant="default"
          onClick={() => {
            setEntries([
              ...entries,
              {
                wavelengthBounds: { min: 390, max: 700 },
                omitBetaBand: true,
                isMaxBasis: false,
                wavelengthSampleResolution: 20,
                spectralPeaks: {
                  peakWavelength1: 455,
                  peakWavelength2: 543,
                  peakWavelength3: 566,
                  peakWavelength4: 560,
                },
                activeCones: {
                  isCone1Active: true,
                  isCone2Active: true,
                  isCone3Active: true,
                  isCone4Active: false,
                },
                selectedSpecies: null,
                entryName: 'New OCS', // Add entryName property
              },
            ]);
          }}
        >
          Add Entry
        </Button>
      </Group>

      <div style={{ height: '100%', overflow: 'auto' }}>
        <Stack spacing="xl">
          {entries.map((entry, index) => (
            <SpectraEntry
              key={index}
              entry={entry}
              index={index}
              entryName={entry.entryName} // Use entryName from entry
              isEditing={isEditingName[index]}
              isCollapsed={collapsedEntries[index]}
              dropdownOptions={dropdownOptions}
              spectralDB={spectralDB}
              onUpdate={handleUpdateEntry}
              onNameChange={(name, idx) => {
                setEntries(prev => {
                  const newEntries = [...prev];
                  newEntries[idx].entryName = name;
                  return newEntries;
                });
              }}
              onToggleEdit={(idx) => {
                setIsEditingName(prev => {
                  const newEditing = [...prev];
                  newEditing[idx] = !newEditing[idx];
                  return newEditing;
                });
              }}
              onDelete={handleDeleteEntry}
              onToggleCollapse={(idx) => {
                setCollapsedEntries(prev => {
                  const newCollapsed = [...prev];
                  newCollapsed[idx] = !newCollapsed[idx];
                  return newCollapsed;
                });
              }}
            />
          ))}
        </Stack>
      </div>
    </form>
  );
}