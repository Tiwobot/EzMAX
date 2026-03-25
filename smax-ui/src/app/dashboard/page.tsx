'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface RequestItem {
  id: string
  displayLabel: string
  isDeleted: boolean
}

interface ContractItem {
  id: string
  displayLabel: string
  isDeleted: boolean
}

interface PersonGroupItem {
  id: string
  name: string
  isDeleted: boolean
}

// Calendar Component
const Calendar = ({ month, year, onMonthChange, onYearChange, onClose, effortTrackers, onEffortClick, onDateClick }: {
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onClose: () => void;
  effortTrackers: any[];
  onEffortClick: (effort: any) => void;
  onDateClick: (year: number, month: number, day: number) => void;
}) => {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()
  
  const days: (number | null)[] = []
  
  // Add days from previous month
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    days.push(null)
  }
  
  // Add days from current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }
  
  // Fill remaining cells to complete the grid
  const remainingCells = 42 - days.length // 6 rows * 7 days
  for (let i = 1; i <= remainingCells; i++) {
    days.push(null)
  }
  
  const goToPreviousMonth = () => {
    if (month === 0) {
      onMonthChange(11)
      onYearChange(year - 1)
    } else {
      onMonthChange(month - 1)
    }
  }
  
  const goToNextMonth = () => {
    if (month === 11) {
      onMonthChange(0)
      onYearChange(year + 1)
    } else {
      onMonthChange(month + 1)
    }
  }
  
  const today = new Date()
  const isToday = (day: number | null) => {
    return day !== null && 
           month === today.getMonth() && 
           year === today.getFullYear() && 
           day === today.getDate()
  }
  
  // Get efforts for a specific date
  const getEffortsForDate = (day: number | null): any[] => {
    if (day === null) return []
    
    const date = new Date(year, month, day)
    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0).getTime()
    const dateEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999).getTime()
    
    return effortTrackers.filter(effort => {
      const effortStart = effort.effortStartDate
      const effortEnd = effort.effortEndDate
      
      // Check if effort overlaps with this date
      return (effortStart <= dateEnd && effortEnd >= dateStart)
    })
  }
  
  // Format time from timestamp
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp)
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }
  
  // Truncate text to specified length
  const truncateText = (text: string, maxLength: number): string => {
    if (!text) return 'No description'
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }
  
  return (
    <div style={{
      width: '100%',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
      }}>
        <button
          type="button"
          onClick={goToPreviousMonth}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            fontWeight: 'bold',
            backgroundColor: '#000000',
            color: '#ffffff',
            border: '2px solid #ffffff',
            cursor: 'pointer',
            fontFamily: 'Arial, sans-serif',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.textDecoration = 'underline'
            e.currentTarget.style.backgroundColor = '#ffffff'
            e.currentTarget.style.color = '#000000'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = 'none'
            e.currentTarget.style.backgroundColor = '#000000'
            e.currentTarget.style.color = '#ffffff'
          }}
        >
          ←
        </button>
        <h3 style={{
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: '1.5rem',
          margin: 0,
        }}>
          {monthNames[month]} {year}
        </h3>
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
        }}>
          <button
            type="button"
            onClick={goToNextMonth}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '1rem',
              fontWeight: 'bold',
              backgroundColor: '#000000',
              color: '#ffffff',
              border: '2px solid #ffffff',
              cursor: 'pointer',
              fontFamily: 'Arial, sans-serif',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline'
              e.currentTarget.style.backgroundColor = '#ffffff'
              e.currentTarget.style.color = '#000000'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none'
              e.currentTarget.style.backgroundColor = '#000000'
              e.currentTarget.style.color = '#ffffff'
            }}
          >
            →
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '1rem',
              fontWeight: 'bold',
              backgroundColor: '#000000',
              color: '#ffffff',
              border: '2px solid #ffffff',
              cursor: 'pointer',
              fontFamily: 'Arial, sans-serif',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline'
              e.currentTarget.style.backgroundColor = '#ffffff'
              e.currentTarget.style.color = '#000000'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none'
              e.currentTarget.style.backgroundColor = '#000000'
              e.currentTarget.style.color = '#ffffff'
            }}
          >
            Close
          </button>
        </div>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '0.25rem',
        border: '1px solid #ffffff',
      }}>
        {dayNames.map((day) => (
          <div
            key={day}
            style={{
              padding: '0.5rem',
              textAlign: 'center',
              color: '#ffffff',
              fontFamily: 'Arial, sans-serif',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              backgroundColor: '#1a1a1a',
              borderBottom: '2px solid #ffffff',
            }}
          >
            {day}
          </div>
        ))}
        {days.map((day, index) => (
          <div
            key={index}
            onClick={() => day !== null && onDateClick(year, month, day)}
            style={{
              minHeight: '120px',
              display: 'flex',
              flexDirection: 'column',
              border: isToday(day) ? '2px solid #ffffff' : '1px solid #333333',
              backgroundColor: day === null ? '#0a0a0a' : (isToday(day) ? '#1a1a1a' : '#000000'),
              cursor: day !== null ? 'pointer' : 'default',
              padding: '0.5rem',
            }}
            onMouseEnter={(e) => {
              if (day !== null) {
                e.currentTarget.style.backgroundColor = '#1a1a1a'
                e.currentTarget.style.borderColor = '#ffffff'
              }
            }}
            onMouseLeave={(e) => {
              if (day !== null && !isToday(day)) {
                e.currentTarget.style.backgroundColor = '#000000'
                e.currentTarget.style.borderColor = '#333333'
              } else if (day !== null && isToday(day)) {
                e.currentTarget.style.backgroundColor = '#1a1a1a'
                e.currentTarget.style.borderColor = '#ffffff'
              }
            }}
          >
            <div style={{
              color: day === null ? '#444444' : (isToday(day) ? '#ffffff' : '#ffffff'),
              fontFamily: 'Arial, sans-serif',
              fontSize: '1rem',
              fontWeight: isToday(day) ? 'bold' : 'normal',
              marginBottom: '0.5rem',
              textAlign: 'left',
            }}>
              {day}
            </div>
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
              overflowY: 'auto',
            }}>
              {day !== null && getEffortsForDate(day).map((effort, idx) => (
                <div
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); onEffortClick(effort); }}
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#333333',
                    border: '1px solid #555555',
                    borderRadius: '2px',
                    fontSize: '0.75rem',
                    color: '#ffffff',
                    fontFamily: 'Arial, sans-serif',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#444444'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#333333'
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '0.1rem' }}>
                    {formatTime(effort.effortStartDate)} - {formatTime(effort.effortEndDate)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#cccccc' }}>
                    {truncateText(effort.effortExplanation || 'No description', 25)}
                  </div>
                  {effort.request && (
                    <div style={{ fontSize: '0.65rem', color: '#aaaaaa', marginTop: '0.1rem' }}>
                      {effort.request}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Custom TimeInput component that forces 24-hour format
const TimeInput = ({ value, onChange, style }: { value: string; onChange: (value: string) => void; style: React.CSSProperties }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value.replace(/[^\d:]/g, '') // Remove non-digit/non-colon characters
    
    // Auto-format as user types
    if (inputValue.length <= 2 && !inputValue.includes(':')) {
      // Just hours typed
      const hours = parseInt(inputValue)
      if (inputValue.length === 2 && hours <= 23) {
        inputValue = inputValue + ':'
      } else if (hours > 23) {
        inputValue = '23:'
      }
    } else if (inputValue.includes(':')) {
      const parts = inputValue.split(':')
      // Limit hours to 2 digits and max 23
      if (parts[0].length > 2) {
        parts[0] = parts[0].substring(0, 2)
      }
      if (parts[0] && parseInt(parts[0]) > 23) {
        parts[0] = '23'
      }
      // Limit minutes to 2 digits and max 59
      if (parts[1] && parts[1].length > 2) {
        parts[1] = parts[1].substring(0, 2)
      }
      if (parts[1] && parseInt(parts[1]) > 59) {
        parts[1] = '59'
      }
      inputValue = parts.join(':')
    }
    
    // Allow any valid intermediate state
    onChange(inputValue)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Ensure format is complete on blur
    const parts = e.target.value.split(':')
    if (parts.length === 2) {
      const hours = parts[0].padStart(2, '0')
      const minutes = parts[1].padStart(2, '0')
      if (parseInt(hours) <= 23 && parseInt(minutes) <= 59) {
        onChange(`${hours}:${minutes}`)
      } else {
        // Reset to empty if invalid
        onChange('')
      }
    } else if (parts.length === 1 && parts[0] && !parts[0].includes(':')) {
      // Only hours entered, add colon
      const hours = parts[0].padStart(2, '0')
      if (parseInt(hours) <= 23) {
        onChange(`${hours}:00`)
      } else {
        onChange('')
      }
    }
  }

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="HH:MM"
      pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
      style={{ ...style, width: '100%' }}
    />
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [filteredRequests, setFilteredRequests] = useState<RequestItem[]>([])
  const [selectedValue, setSelectedValue] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [createNew, setCreateNew] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [contractId, setContractId] = useState<string>('')
  const [contractName, setContractName] = useState<string>('')
  const [loadingContract, setLoadingContract] = useState(false)
  const [effortExplanation, setEffortExplanation] = useState<string>('')
  const [effortStartDate, setEffortStartDate] = useState<string>('')
  const [effortStartTime, setEffortStartTime] = useState<string>('')
  const [effortEndDate, setEffortEndDate] = useState<string>('')
  const [effortEndTime, setEffortEndTime] = useState<string>('')
  const [scheduled, setScheduled] = useState(false)
  const [showScheduledExplanation, setShowScheduledExplanation] = useState(false)
  const [contracts, setContracts] = useState<ContractItem[]>([])
  const [filteredContracts, setFilteredContracts] = useState<ContractItem[]>([])
  const [selectedContract, setSelectedContract] = useState<string>('')
  const [contractSearchTerm, setContractSearchTerm] = useState<string>('')
  const [loadingContracts, setLoadingContracts] = useState(false)
  const [newContractName, setNewContractName] = useState<string>('')
  const [newContractDescription, setNewContractDescription] = useState<string>('')
  const [personGroups, setPersonGroups] = useState<PersonGroupItem[]>([])
  const [filteredPersonGroups, setFilteredPersonGroups] = useState<PersonGroupItem[]>([])
  const [selectedPersonGroup, setSelectedPersonGroup] = useState<string>('')
  const [personGroupSearchTerm, setPersonGroupSearchTerm] = useState<string>('')
  const [loadingPersonGroups, setLoadingPersonGroups] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [effortTrackers, setEffortTrackers] = useState<any[]>([])
  const [loadingEffortTrackers, setLoadingEffortTrackers] = useState(false)
  const [selectedEffort, setSelectedEffort] = useState<any | null>(null)
  const [weekly, setWeekly] = useState(false)
  const [weeklyPeriodEnd, setWeeklyPeriodEnd] = useState<string>('')
  const [excludeWeeks, setExcludeWeeks] = useState<Set<string>>(new Set())
  const [favoriteContracts, setFavoriteContracts] = useState<string[]>([])
  const [favoritePersonGroups, setFavoritePersonGroups] = useState<string[]>([])

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const savedContracts = localStorage.getItem('ezmax_favorite_contracts')
      const savedGroups = localStorage.getItem('ezmax_favorite_person_groups')
      if (savedContracts) setFavoriteContracts(JSON.parse(savedContracts))
      if (savedGroups) setFavoritePersonGroups(JSON.parse(savedGroups))
    } catch (e) {}
  }, [])

  const toggleFavoriteContract = (id: string) => {
    setFavoriteContracts(prev => {
      const next = prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
      localStorage.setItem('ezmax_favorite_contracts', JSON.stringify(next))
      return next
    })
  }

  const toggleFavoritePersonGroup = (id: string) => {
    setFavoritePersonGroups(prev => {
      const next = prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
      localStorage.setItem('ezmax_favorite_person_groups', JSON.stringify(next))
      return next
    })
  }

  const handleCalendarDateClick = (year: number, month: number, day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setEffortStartDate(dateStr)
    setEffortEndDate(dateStr)
    setEffortStartTime('')
    setEffortEndTime('')
    setShowCalendar(false)
  }

  useEffect(() => {
    fetchRequests()
    fetchPerson()
  }, [])

  useEffect(() => {
    // Fetch contract when a request is selected and create new is not checked
    if (selectedValue && !createNew) {
      fetchContract(selectedValue)
    } else {
      // Clear contract when deselected or create new is checked
      setContractId('')
      setContractName('')
    }
  }, [selectedValue, createNew])

  useEffect(() => {
    // Fetch contracts when "Create New" is checked
    if (createNew) {
      fetchContracts()
    } else {
      // Clear contracts when "Create New" is unchecked
      setContracts([])
      setFilteredContracts([])
      setSelectedContract('')
      setContractSearchTerm('')
      setNewContractName('')
      setNewContractDescription('')
      setPersonGroups([])
      setFilteredPersonGroups([])
      setSelectedPersonGroup('')
      setPersonGroupSearchTerm('')
    }
  }, [createNew])

  useEffect(() => {
    // Filter contracts based on search term, sort favorites to top
    let result = contracts
    if (contractSearchTerm.trim() !== '') {
      result = result.filter(contract =>
        contract.displayLabel.toLowerCase().includes(contractSearchTerm.toLowerCase()) ||
        contract.id.toLowerCase().includes(contractSearchTerm.toLowerCase())
      )
    }
    result = [...result].sort((a, b) => {
      const aFav = favoriteContracts.includes(a.id) ? 0 : 1
      const bFav = favoriteContracts.includes(b.id) ? 0 : 1
      return aFav - bFav
    })
    setFilteredContracts(result)
  }, [contractSearchTerm, contracts, favoriteContracts])

  useEffect(() => {
    // Fetch person groups when a contract is selected
    if (selectedContract) {
      fetchPersonGroups()
    } else {
      // Clear person groups when contract is deselected
      setPersonGroups([])
      setFilteredPersonGroups([])
      setSelectedPersonGroup('')
      setPersonGroupSearchTerm('')
    }
  }, [selectedContract])

  useEffect(() => {
    // Filter person groups based on search term, sort favorites to top
    let result = personGroups
    if (personGroupSearchTerm.trim() !== '') {
      result = result.filter(group =>
        group.name.toLowerCase().includes(personGroupSearchTerm.toLowerCase()) ||
        group.id.toLowerCase().includes(personGroupSearchTerm.toLowerCase())
      )
    }
    result = [...result].sort((a, b) => {
      const aFav = favoritePersonGroups.includes(a.id) ? 0 : 1
      const bFav = favoritePersonGroups.includes(b.id) ? 0 : 1
      return aFav - bFav
    })
    setFilteredPersonGroups(result)
  }, [personGroupSearchTerm, personGroups, favoritePersonGroups])

  useEffect(() => {
    // Filter requests based on search term
    if (searchTerm.trim() === '') {
      setFilteredRequests(requests)
    } else {
      const filtered = requests.filter(req =>
        req.displayLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredRequests(filtered)
    }
  }, [searchTerm, requests])

  useEffect(() => {
    // Fetch effort trackers when calendar is opened
    if (showCalendar) {
      fetchEffortTrackers()
    }
  }, [showCalendar])

  const fetchRequests = async () => {
    try {
      const xsrf_token = localStorage.getItem('xsrf_token')
      if (!xsrf_token) {
        alert('No session found. Please login again.')
        return
      }

      const response = await fetch('http://localhost:8082/api/requests', {
        method: 'GET',
        headers: {
          'X-XSRF-Token': xsrf_token,
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setRequests(data.requests)
        setFilteredRequests(data.requests)
      } else {
        alert(data.detail || 'Failed to fetch requests')
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
      alert('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const fetchPerson = async () => {
    try {
      const xsrf_token = localStorage.getItem('xsrf_token')
      if (!xsrf_token) {
        return
      }

      const response = await fetch('http://localhost:8082/api/person', {
        method: 'GET',
        headers: {
          'X-XSRF-Token': xsrf_token,
        },
      })

      const data = await response.json()

      if (response.ok && data.success && data.name) {
        setUserName(data.name)
        setUserId(data.id || '')
      }
    } catch (error) {
      console.error('Error fetching person:', error)
    }
  }

  const fetchContract = async (requestId: string) => {
    try {
      setLoadingContract(true)
      const xsrf_token = localStorage.getItem('xsrf_token')
      if (!xsrf_token) {
        return
      }

      const response = await fetch('http://localhost:8082/api/contract', {
        method: 'POST',
        headers: {
          'X-XSRF-Token': xsrf_token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ request_id: requestId }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setContractId(data.contract_id || '')
        setContractName(data.contract_name || '')
      } else {
        setContractId('')
        setContractName('')
      }
    } catch (error) {
      console.error('Error fetching contract:', error)
      setContractId('')
      setContractName('')
    } finally {
      setLoadingContract(false)
    }
  }

  const fetchContracts = async () => {
    try {
      setLoadingContracts(true)
      const xsrf_token = localStorage.getItem('xsrf_token')
      if (!xsrf_token) {
        return
      }

      const response = await fetch('http://localhost:8082/api/contracts', {
        method: 'GET',
        headers: {
          'X-XSRF-Token': xsrf_token,
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setContracts(data.contracts)
        setFilteredContracts(data.contracts)
      } else {
        alert(data.detail || 'Failed to fetch contracts')
      }
    } catch (error) {
      console.error('Error fetching contracts:', error)
      alert('Failed to connect to server')
    } finally {
      setLoadingContracts(false)
    }
  }

  const fetchPersonGroups = async () => {
    try {
      setLoadingPersonGroups(true)
      const xsrf_token = localStorage.getItem('xsrf_token')
      if (!xsrf_token) {
        return
      }

      const response = await fetch('http://localhost:8082/api/person-groups', {
        method: 'GET',
        headers: {
          'X-XSRF-Token': xsrf_token,
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setPersonGroups(data.personGroups)
        setFilteredPersonGroups(data.personGroups)
      } else {
        alert(data.detail || 'Failed to fetch person groups')
      }
    } catch (error) {
      console.error('Error fetching person groups:', error)
      alert('Failed to connect to server')
    } finally {
      setLoadingPersonGroups(false)
    }
  }

  const fetchEffortTrackers = async () => {
    try {
      setLoadingEffortTrackers(true)
      const xsrf_token = localStorage.getItem('xsrf_token')
      if (!xsrf_token) {
        alert('No session found. Please login again.')
        return
      }

      const response = await fetch('http://localhost:8082/api/effort-trackers', {
        method: 'GET',
        headers: {
          'X-XSRF-Token': xsrf_token,
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setEffortTrackers(data.effortTrackers || [])
      } else {
        console.error('Failed to fetch effort trackers:', data.detail || 'Unknown error')
        setEffortTrackers([])
      }
    } catch (error) {
      console.error('Error fetching effort trackers:', error)
      setEffortTrackers([])
    } finally {
      setLoadingEffortTrackers(false)
    }
  }

  // Compute weekly dates for preview
  const getWeeklyDates = (): string[] => {
    if (!effortStartDate || !weeklyPeriodEnd) return []
    const dates: string[] = []
    const start = new Date(effortStartDate)
    const end = new Date(weeklyPeriodEnd)
    const current = new Date(start)
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + 7)
    }
    return dates
  }

  const weeklyDates = weekly ? getWeeklyDates() : []

  const toggleExcludeWeek = (dateStr: string) => {
    setExcludeWeeks(prev => {
      const next = new Set(prev)
      if (next.has(dateStr)) {
        next.delete(dateStr)
      } else {
        next.add(dateStr)
      }
      return next
    })
  }

  const isFormValid = () => {
    const baseValid = effortExplanation && effortStartDate && effortStartTime &&
      (weekly ? weeklyPeriodEnd : (effortEndDate && effortEndTime))

    if (weekly && !effortEndTime) return false

    if (createNew) {
      return (
        selectedContract &&
        selectedPersonGroup &&
        newContractName &&
        newContractDescription &&
        baseValid
      )
    } else {
      return (
        selectedValue &&
        contractId &&
        baseValid
      )
    }
  }

  const handleSend = async () => {
    if (!isFormValid()) {
      alert('Please fill in all required fields')
      return
    }

    const xsrf_token = localStorage.getItem('xsrf_token')
    if (!xsrf_token) {
      alert('No session found. Please login again.')
      return
    }

    // Combine date and time and convert to timestamp (milliseconds)
    const startDateTime = `${effortStartDate}T${effortStartTime}`
    const endDate = weekly ? effortStartDate : effortEndDate
    const endDateTime = `${endDate}T${effortEndTime}`
    const startTimestamp = new Date(startDateTime).getTime()
    const endTimestamp = new Date(endDateTime).getTime()

    let sendData: any = {
      userId: userId,
      userName: userName,
      effortExplanation: effortExplanation,
      effortStartDate: startTimestamp,
      effortEndDate: endTimestamp,
      scheduled: scheduled,
      weekly: weekly,
      ...(weekly && weeklyPeriodEnd ? {
        weeklyPeriodEnd: new Date(`${weeklyPeriodEnd}T${effortEndTime}`).getTime(),
        excludeWeeks: Array.from(excludeWeeks),
      } : {}),
    }

    if (createNew) {
      // "Create new" flow data
      sendData = {
        ...sendData,
        createNew: true,
        contractId: selectedContract,
        personGroupId: selectedPersonGroup,
        name: newContractName,
        description: newContractDescription,
      }
    } else {
      // Normal flow data
      sendData = {
        ...sendData,
        createNew: false,
        requestId: selectedValue,
        contractId: contractId,
      }
    }

    try {
      const response = await fetch('http://localhost:8082/api/send', {
        method: 'POST',
        headers: {
          'X-XSRF-Token': xsrf_token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sendData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        alert('Data sent successfully!')
      } else {
        alert(data.detail || 'Failed to send data')
      }
    } catch (error) {
      console.error('Error sending data:', error)
      alert('Failed to connect to server')
    }
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000000',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '2rem',
      position: 'relative',
    }}>
      <button
        type="button"
        onClick={() => router.push('/')}
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          fontWeight: 'bold',
          backgroundColor: '#000000',
          color: '#ffffff',
          border: '2px solid #ffffff',
          cursor: 'pointer',
          fontFamily: 'Arial, sans-serif',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.textDecoration = 'underline'
          e.currentTarget.style.backgroundColor = '#ffffff'
          e.currentTarget.style.color = '#000000'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.textDecoration = 'none'
          e.currentTarget.style.backgroundColor = '#000000'
          e.currentTarget.style.color = '#ffffff'
        }}
      >
        Back to Login
      </button>
      <button
        type="button"
        onClick={() => setShowCalendar(!showCalendar)}
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          fontWeight: 'bold',
          backgroundColor: showCalendar ? '#ffffff' : '#000000',
          color: showCalendar ? '#000000' : '#ffffff',
          border: '2px solid #ffffff',
          cursor: 'pointer',
          fontFamily: 'Arial, sans-serif',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.textDecoration = 'underline'
          if (!showCalendar) {
            e.currentTarget.style.backgroundColor = '#ffffff'
            e.currentTarget.style.color = '#000000'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.textDecoration = 'none'
          if (!showCalendar) {
            e.currentTarget.style.backgroundColor = '#000000'
            e.currentTarget.style.color = '#ffffff'
          }
        }}
      >
        Calendar
      </button>
      {userName && (
        <div style={{
          position: 'absolute',
          bottom: '1rem',
          left: '1rem',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: '1.2rem',
        }}>
          {userName}
        </div>
      )}
      {showCalendar && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#000000',
            border: '2px solid #ffffff',
            padding: '2rem',
            maxWidth: '1400px',
            width: '95%',
            maxHeight: '95vh',
            overflow: 'auto',
          }}>
            <Calendar
              month={currentMonth}
              year={currentYear}
              onMonthChange={setCurrentMonth}
              onYearChange={setCurrentYear}
              onClose={() => setShowCalendar(false)}
              effortTrackers={effortTrackers}
              onEffortClick={(effort) => setSelectedEffort(effort)}
              onDateClick={handleCalendarDateClick}
            />
          </div>
        </div>
      )}
      {selectedEffort && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
        }}
        onClick={() => setSelectedEffort(null)}
        >
          <div style={{
            backgroundColor: '#000000',
            border: '2px solid #ffffff',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
            }}>
              <h2 style={{
                color: '#ffffff',
                fontFamily: 'Arial, sans-serif',
                fontSize: '1.5rem',
                margin: 0,
              }}>
                Effort Details
              </h2>
              <button
                type="button"
                onClick={() => setSelectedEffort(null)}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  border: '2px solid #ffffff',
                  cursor: 'pointer',
                  fontFamily: 'Arial, sans-serif',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline'
                  e.currentTarget.style.backgroundColor = '#ffffff'
                  e.currentTarget.style.color = '#000000'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none'
                  e.currentTarget.style.backgroundColor = '#000000'
                  e.currentTarget.style.color = '#ffffff'
                }}
              >
                Close
              </button>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              color: '#ffffff',
              fontFamily: 'Arial, sans-serif',
            }}>
              <div>
                <div style={{ fontSize: '0.9rem', color: '#aaaaaa', marginBottom: '0.25rem' }}>Time Range</div>
                <div style={{ fontSize: '1.1rem' }}>
                  {new Date(selectedEffort.effortStartDate).toLocaleString()} - {new Date(selectedEffort.effortEndDate).toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', color: '#aaaaaa', marginBottom: '0.25rem' }}>Effort Explanation</div>
                <div style={{ fontSize: '1rem' }}>{selectedEffort.effortExplanation || 'No description'}</div>
              </div>
              {selectedEffort.totalEffortTime && (
                <div>
                  <div style={{ fontSize: '0.9rem', color: '#aaaaaa', marginBottom: '0.25rem' }}>Total Effort Time</div>
                  <div style={{ fontSize: '1rem' }}>{selectedEffort.totalEffortTime}</div>
                </div>
              )}
              {selectedEffort.request && (
                <div>
                  <div style={{ fontSize: '0.9rem', color: '#aaaaaa', marginBottom: '0.25rem' }}>Request</div>
                  <div style={{ fontSize: '1rem' }}>{selectedEffort.request}</div>
                </div>
              )}
              {selectedEffort.contract && (
                <div>
                  <div style={{ fontSize: '0.9rem', color: '#aaaaaa', marginBottom: '0.25rem' }}>Contract</div>
                  <div style={{ fontSize: '1rem' }}>{selectedEffort.contract}</div>
                </div>
              )}
              {(selectedEffort.hours || selectedEffort.minutes || selectedEffort.days) && (
                <div>
                  <div style={{ fontSize: '0.9rem', color: '#aaaaaa', marginBottom: '0.25rem' }}>Breakdown</div>
                  <div style={{ fontSize: '1rem' }}>
                    {selectedEffort.days > 0 && `${selectedEffort.days} day(s) `}
                    {selectedEffort.hours > 0 && `${selectedEffort.hours} hour(s) `}
                    {selectedEffort.minutes > 0 && `${selectedEffort.minutes} minute(s)`}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        width: '100%',
        maxWidth: '800px',
      }}>
        {loading ? (
          <div style={{ color: '#ffffff', textAlign: 'center' }}>Loading requests...</div>
        ) : (
          <div style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}>
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={createNew}
              style={{
                padding: '1rem',
                fontSize: '1.2rem',
                backgroundColor: createNew ? '#333333' : '#000000',
                color: createNew ? '#888888' : '#ffffff',
                border: '2px solid #ffffff',
                outline: 'none',
                fontFamily: 'Arial, sans-serif',
                width: '200px',
                position: 'absolute',
                left: 0,
                opacity: createNew ? 0.5 : 1,
                cursor: createNew ? 'not-allowed' : 'text',
              }}
            />

            <select
              value={selectedValue}
              onChange={(e) => setSelectedValue(e.target.value)}
              disabled={createNew}
              style={{
                padding: '1rem',
                fontSize: '1.2rem',
                backgroundColor: createNew ? '#333333' : '#000000',
                color: createNew ? '#888888' : '#ffffff',
                border: '2px solid #ffffff',
                outline: 'none',
                fontFamily: 'Arial, sans-serif',
                cursor: createNew ? 'not-allowed' : 'pointer',
                width: '400px',
                opacity: createNew ? 0.5 : 1,
              }}
            >
              <option value="" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                Select a request
              </option>
              {filteredRequests.map((req) => (
                <option
                  key={req.id}
                  value={req.id}
                  style={{ backgroundColor: '#000000', color: '#ffffff' }}
                >
                  {req.id}: {req.displayLabel} {req.isDeleted ? '(Deleted)' : ''}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setCreateNew(!createNew)}
              style={{
                padding: '1rem 1.5rem',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                backgroundColor: createNew ? '#ffffff' : '#000000',
                color: createNew ? '#000000' : '#ffffff',
                border: '2px solid #ffffff',
                cursor: 'pointer',
                fontFamily: 'Arial, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                position: 'absolute',
                right: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none'
              }}
            >
              Create new
            </button>
          </div>
        )}

        {createNew && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            width: '100%',
          }}>
            <div style={{
              display: 'flex',
              gap: '1rem',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              width: '100%',
            }}>
              <input
                type="text"
                placeholder="Search contracts..."
                value={contractSearchTerm}
                onChange={(e) => setContractSearchTerm(e.target.value)}
                style={{
                  padding: '1rem',
                  fontSize: '1.2rem',
                  backgroundColor: '#000000',
                  color: '#ffffff',
                  border: '2px solid #ffffff',
                  outline: 'none',
                  fontFamily: 'Arial, sans-serif',
                  width: '200px',
                  position: 'absolute',
                  left: 0,
                }}
              />
              {loadingContracts ? (
                <div style={{ color: '#ffffff', textAlign: 'center', width: '100%' }}>Loading contracts...</div>
              ) : (
                <select
                  value={selectedContract}
                  onChange={(e) => setSelectedContract(e.target.value)}
                  style={{
                    padding: '1rem',
                    fontSize: '1.2rem',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    border: '2px solid #ffffff',
                    outline: 'none',
                    fontFamily: 'Arial, sans-serif',
                    cursor: 'pointer',
                    flex: 1,
                    marginLeft: '200px',
                  }}
                >
                  <option value="" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                    Select a contract
                  </option>
                  {filteredContracts.map((contract) => (
                    <option
                      key={contract.id}
                      value={contract.id}
                      style={{ backgroundColor: '#000000', color: '#ffffff' }}
                    >
                      {favoriteContracts.includes(contract.id) ? '\u2605 ' : ''}{contract.id}: {contract.displayLabel} {contract.isDeleted ? '(Deleted)' : ''}
                    </option>
                  ))}
                </select>
              )}
              {selectedContract && (
                <button
                  type="button"
                  onClick={() => toggleFavoriteContract(selectedContract)}
                  title={favoriteContracts.includes(selectedContract) ? 'Unpin contract' : 'Pin contract to top'}
                  style={{
                    padding: '0.75rem 1rem',
                    fontSize: '1.2rem',
                    backgroundColor: favoriteContracts.includes(selectedContract) ? '#ffffff' : '#000000',
                    color: favoriteContracts.includes(selectedContract) ? '#000000' : '#ffffff',
                    border: '2px solid #ffffff',
                    cursor: 'pointer',
                    fontFamily: 'Arial, sans-serif',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = 'underline'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = 'none'
                  }}
                >
                  {favoriteContracts.includes(selectedContract) ? '\u2605' : '\u2606'}
                </button>
              )}
            </div>
            {selectedContract && (
              <>
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  width: '100%',
                }}>
                  <input
                    type="text"
                    placeholder="Search person groups..."
                    value={personGroupSearchTerm}
                    onChange={(e) => setPersonGroupSearchTerm(e.target.value)}
                    style={{
                      padding: '1rem',
                      fontSize: '1.2rem',
                      backgroundColor: '#000000',
                      color: '#ffffff',
                      border: '2px solid #ffffff',
                      outline: 'none',
                      fontFamily: 'Arial, sans-serif',
                      width: '200px',
                      position: 'absolute',
                      left: 0,
                    }}
                  />
                  {loadingPersonGroups ? (
                    <div style={{ color: '#ffffff', textAlign: 'center', width: '100%' }}>Loading person groups...</div>
                  ) : (
                    <select
                      value={selectedPersonGroup}
                      onChange={(e) => setSelectedPersonGroup(e.target.value)}
                      style={{
                        padding: '1rem',
                        fontSize: '1.2rem',
                        backgroundColor: '#000000',
                        color: '#ffffff',
                        border: '2px solid #ffffff',
                        outline: 'none',
                        fontFamily: 'Arial, sans-serif',
                        cursor: 'pointer',
                        flex: 1,
                        marginLeft: '200px',
                      }}
                    >
                      <option value="" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                        Select a person group
                      </option>
                      {filteredPersonGroups.map((group) => (
                        <option
                          key={group.id}
                          value={group.id}
                          style={{ backgroundColor: '#000000', color: '#ffffff' }}
                        >
                          {favoritePersonGroups.includes(group.id) ? '\u2605 ' : ''}{group.id}: {group.name} {group.isDeleted ? '(Deleted)' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  {selectedPersonGroup && (
                    <button
                      type="button"
                      onClick={() => toggleFavoritePersonGroup(selectedPersonGroup)}
                      title={favoritePersonGroups.includes(selectedPersonGroup) ? 'Unpin group' : 'Pin group to top'}
                      style={{
                        padding: '0.75rem 1rem',
                        fontSize: '1.2rem',
                        backgroundColor: favoritePersonGroups.includes(selectedPersonGroup) ? '#ffffff' : '#000000',
                        color: favoritePersonGroups.includes(selectedPersonGroup) ? '#000000' : '#ffffff',
                        border: '2px solid #ffffff',
                        cursor: 'pointer',
                        fontFamily: 'Arial, sans-serif',
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.textDecoration = 'underline'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.textDecoration = 'none'
                      }}
                    >
                      {favoritePersonGroups.includes(selectedPersonGroup) ? '\u2605' : '\u2606'}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Name"
                  value={newContractName}
                  onChange={(e) => setNewContractName(e.target.value)}
                  style={{
                    padding: '1rem',
                    fontSize: '1.2rem',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    border: '2px solid #ffffff',
                    outline: 'none',
                    fontFamily: 'Arial, sans-serif',
                    width: '100%',
                  }}
                />

                <input
                  type="text"
                  placeholder="Description"
                  value={newContractDescription}
                  onChange={(e) => setNewContractDescription(e.target.value)}
                  style={{
                    padding: '1rem',
                    fontSize: '1.2rem',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    border: '2px solid #ffffff',
                    outline: 'none',
                    fontFamily: 'Arial, sans-serif',
                    width: '100%',
                  }}
                />

                {selectedContract && selectedPersonGroup && newContractName && newContractDescription && (
                  <>
                    <input
                      type="text"
                      placeholder="Effort Explanation"
                      value={effortExplanation}
                      onChange={(e) => setEffortExplanation(e.target.value)}
                      style={{
                        padding: '1rem',
                        fontSize: '1.2rem',
                        backgroundColor: '#000000',
                        color: '#ffffff',
                        border: '2px solid #ffffff',
                        outline: 'none',
                        fontFamily: 'Arial, sans-serif',
                        width: '100%',
                      }}
                    />

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      width: '100%',
                    }}>
                      <button
                        type="button"
                        onClick={() => { setScheduled(!scheduled); if (!scheduled) setWeekly(false); }}
                        style={{
                          padding: '1rem 1.5rem',
                          fontSize: '1.2rem',
                          fontWeight: 'bold',
                          backgroundColor: scheduled ? '#ffffff' : '#000000',
                          color: scheduled ? '#000000' : '#ffffff',
                          border: '2px solid #ffffff',
                          cursor: 'pointer',
                          fontFamily: 'Arial, sans-serif',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = 'underline'
                          setShowScheduledExplanation(true)
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = 'none'
                          setShowScheduledExplanation(false)
                        }}
                      >
                        Scheduled
                      </button>
                      <button
                        type="button"
                        onClick={() => { setWeekly(!weekly); if (!weekly) { setScheduled(false); setExcludeWeeks(new Set()); } }}
                        style={{
                          padding: '1rem 1.5rem',
                          fontSize: '1.2rem',
                          fontWeight: 'bold',
                          backgroundColor: weekly ? '#ffffff' : '#000000',
                          color: weekly ? '#000000' : '#ffffff',
                          border: '2px solid #ffffff',
                          cursor: 'pointer',
                          fontFamily: 'Arial, sans-serif',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = 'underline'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = 'none'
                        }}
                      >
                        Weekly
                      </button>
                      {showScheduledExplanation && (
                        <div style={{
                          color: '#ffffff',
                          fontFamily: 'Arial, sans-serif',
                          fontSize: '1rem',
                          flex: 1,
                        }}>
                          When enabled, creates separate effort entries for each day between start and end dates, using the same start and end times for each day.
                        </div>
                      )}
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '1rem',
                      width: '100%',
                    }}>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        flex: 1,
                      }}>
                        <label style={{
                          color: '#ffffff',
                          fontFamily: 'Arial, sans-serif',
                          fontSize: '1rem',
                        }}>
                          {weekly ? 'First Date' : 'Start Date'}
                        </label>
                        <input
                          type="date"
                          value={effortStartDate}
                          onChange={(e) => setEffortStartDate(e.target.value)}
                          style={{
                            padding: '1rem',
                            fontSize: '1.2rem',
                            backgroundColor: '#000000',
                            color: '#ffffff',
                            border: '2px solid #ffffff',
                            outline: 'none',
                            fontFamily: 'Arial, sans-serif',
                          }}
                        />
                      </div>

                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        flex: 1,
                      }}>
                        <label style={{
                          color: '#ffffff',
                          fontFamily: 'Arial, sans-serif',
                          fontSize: '1rem',
                        }}>
                          Start Time
                        </label>
                        <TimeInput
                          value={effortStartTime}
                          onChange={setEffortStartTime}
                          style={{
                            padding: '1rem',
                            fontSize: '1.2rem',
                            backgroundColor: '#000000',
                            color: '#ffffff',
                            border: '2px solid #ffffff',
                            outline: 'none',
                            fontFamily: 'Arial, sans-serif',
                          }}
                        />
                      </div>

                      {!weekly && (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        flex: 1,
                      }}>
                        <label style={{
                          color: '#ffffff',
                          fontFamily: 'Arial, sans-serif',
                          fontSize: '1rem',
                        }}>
                          End Date
                        </label>
                        <input
                          type="date"
                          value={effortEndDate}
                          onChange={(e) => setEffortEndDate(e.target.value)}
                          style={{
                            padding: '1rem',
                            fontSize: '1.2rem',
                            backgroundColor: '#000000',
                            color: '#ffffff',
                            border: '2px solid #ffffff',
                            outline: 'none',
                            fontFamily: 'Arial, sans-serif',
                          }}
                        />
                      </div>
                      )}

                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        flex: 1,
                      }}>
                        <label style={{
                          color: '#ffffff',
                          fontFamily: 'Arial, sans-serif',
                          fontSize: '1rem',
                        }}>
                          End Time
                        </label>
                        <TimeInput
                          value={effortEndTime}
                          onChange={setEffortEndTime}
                          style={{
                            padding: '1rem',
                            fontSize: '1.2rem',
                            backgroundColor: '#000000',
                            color: '#ffffff',
                            border: '2px solid #ffffff',
                            outline: 'none',
                            fontFamily: 'Arial, sans-serif',
                          }}
                        />
                      </div>
                    </div>

                    {weekly && (
                      <>
                        <div style={{
                          display: 'flex',
                          gap: '1rem',
                          width: '100%',
                        }}>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                            flex: 1,
                          }}>
                            <label style={{
                              color: '#ffffff',
                              fontFamily: 'Arial, sans-serif',
                              fontSize: '1rem',
                            }}>
                              Repeat Until
                            </label>
                            <input
                              type="date"
                              value={weeklyPeriodEnd}
                              onChange={(e) => { setWeeklyPeriodEnd(e.target.value); setExcludeWeeks(new Set()); }}
                              style={{
                                padding: '1rem',
                                fontSize: '1.2rem',
                                backgroundColor: '#000000',
                                color: '#ffffff',
                                border: '2px solid #ffffff',
                                outline: 'none',
                                fontFamily: 'Arial, sans-serif',
                              }}
                            />
                          </div>
                        </div>

                        {weeklyDates.length > 0 && (
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                            width: '100%',
                          }}>
                            <label style={{
                              color: '#ffffff',
                              fontFamily: 'Arial, sans-serif',
                              fontSize: '1rem',
                            }}>
                              Weeks ({weeklyDates.length - excludeWeeks.size} of {weeklyDates.length} selected)
                            </label>
                            <div style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '0.5rem',
                            }}>
                              {weeklyDates.map(dateStr => {
                                const excluded = excludeWeeks.has(dateStr)
                                const d = new Date(dateStr + 'T00:00:00')
                                const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                                return (
                                  <button
                                    key={dateStr}
                                    type="button"
                                    onClick={() => toggleExcludeWeek(dateStr)}
                                    style={{
                                      padding: '0.5rem 1rem',
                                      fontSize: '1rem',
                                      backgroundColor: excluded ? '#333333' : '#ffffff',
                                      color: excluded ? '#666666' : '#000000',
                                      border: excluded ? '1px solid #555555' : '2px solid #ffffff',
                                      cursor: 'pointer',
                                      fontFamily: 'Arial, sans-serif',
                                      textDecoration: excluded ? 'line-through' : 'none',
                                      opacity: excluded ? 0.5 : 1,
                                    }}
                                  >
                                    {label}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {(contractId && contractName) && (
          <>
            <button
              type="button"
              disabled
              style={{
                padding: '1rem',
                fontSize: '1.2rem',
                backgroundColor: '#000000',
                color: '#ffffff',
                border: '2px solid #ffffff',
                cursor: 'default',
                fontFamily: 'Arial, sans-serif',
                width: '100%',
              }}
            >
              {contractId}: {contractName}
            </button>

            <input
              type="text"
              placeholder="Effort Explanation"
              value={effortExplanation}
              onChange={(e) => setEffortExplanation(e.target.value)}
              style={{
                padding: '1rem',
                fontSize: '1.2rem',
                backgroundColor: '#000000',
                color: '#ffffff',
                border: '2px solid #ffffff',
                outline: 'none',
                fontFamily: 'Arial, sans-serif',
                width: '100%',
              }}
            />

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              width: '100%',
            }}>
              <button
                type="button"
                onClick={() => { setScheduled(!scheduled); if (!scheduled) setWeekly(false); }}
                style={{
                  padding: '1rem 1.5rem',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  backgroundColor: scheduled ? '#ffffff' : '#000000',
                  color: scheduled ? '#000000' : '#ffffff',
                  border: '2px solid #ffffff',
                  cursor: 'pointer',
                  fontFamily: 'Arial, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline'
                  setShowScheduledExplanation(true)
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none'
                  setShowScheduledExplanation(false)
                }}
              >
                Scheduled
              </button>
              <button
                type="button"
                onClick={() => { setWeekly(!weekly); if (!weekly) { setScheduled(false); setExcludeWeeks(new Set()); } }}
                style={{
                  padding: '1rem 1.5rem',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  backgroundColor: weekly ? '#ffffff' : '#000000',
                  color: weekly ? '#000000' : '#ffffff',
                  border: '2px solid #ffffff',
                  cursor: 'pointer',
                  fontFamily: 'Arial, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none'
                }}
              >
                Weekly
              </button>
              {showScheduledExplanation && (
                <div style={{
                  color: '#ffffff',
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '1rem',
                  flex: 1,
                }}>
                  When enabled, creates separate effort entries for each day between start and end dates, using the same start and end times for each day.
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              gap: '1rem',
              width: '100%',
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                flex: 1,
              }}>
                <label style={{
                  color: '#ffffff',
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '1rem',
                }}>
                  {weekly ? 'First Date' : 'Start Date'}
                </label>
                <input
                  type="date"
                  value={effortStartDate}
                  onChange={(e) => setEffortStartDate(e.target.value)}
                  style={{
                    padding: '1rem',
                    fontSize: '1.2rem',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    border: '2px solid #ffffff',
                    outline: 'none',
                    fontFamily: 'Arial, sans-serif',
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                flex: 1,
              }}>
                <label style={{
                  color: '#ffffff',
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '1rem',
                }}>
                  Start Time
                </label>
                <TimeInput
                  value={effortStartTime}
                  onChange={setEffortStartTime}
                  style={{
                    padding: '1rem',
                    fontSize: '1.2rem',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    border: '2px solid #ffffff',
                    outline: 'none',
                    fontFamily: 'Arial, sans-serif',
                  }}
                />
              </div>

              {!weekly && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                flex: 1,
              }}>
                <label style={{
                  color: '#ffffff',
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '1rem',
                }}>
                  End Date
                </label>
                <input
                  type="date"
                  value={effortEndDate}
                  onChange={(e) => setEffortEndDate(e.target.value)}
                  style={{
                    padding: '1rem',
                    fontSize: '1.2rem',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    border: '2px solid #ffffff',
                    outline: 'none',
                    fontFamily: 'Arial, sans-serif',
                  }}
                />
              </div>
              )}

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                flex: 1,
              }}>
                <label style={{
                  color: '#ffffff',
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '1rem',
                }}>
                  End Time
                </label>
                <TimeInput
                  value={effortEndTime}
                  onChange={setEffortEndTime}
                  style={{
                    padding: '1rem',
                    fontSize: '1.2rem',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    border: '2px solid #ffffff',
                    outline: 'none',
                    fontFamily: 'Arial, sans-serif',
                  }}
                />
              </div>
            </div>

            {weekly && (
              <>
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  width: '100%',
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    flex: 1,
                  }}>
                    <label style={{
                      color: '#ffffff',
                      fontFamily: 'Arial, sans-serif',
                      fontSize: '1rem',
                    }}>
                      Repeat Until
                    </label>
                    <input
                      type="date"
                      value={weeklyPeriodEnd}
                      onChange={(e) => { setWeeklyPeriodEnd(e.target.value); setExcludeWeeks(new Set()); }}
                      style={{
                        padding: '1rem',
                        fontSize: '1.2rem',
                        backgroundColor: '#000000',
                        color: '#ffffff',
                        border: '2px solid #ffffff',
                        outline: 'none',
                        fontFamily: 'Arial, sans-serif',
                      }}
                    />
                  </div>
                </div>

                {weeklyDates.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    width: '100%',
                  }}>
                    <label style={{
                      color: '#ffffff',
                      fontFamily: 'Arial, sans-serif',
                      fontSize: '1rem',
                    }}>
                      Weeks ({weeklyDates.length - excludeWeeks.size} of {weeklyDates.length} selected)
                    </label>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}>
                      {weeklyDates.map(dateStr => {
                        const excluded = excludeWeeks.has(dateStr)
                        const d = new Date(dateStr + 'T00:00:00')
                        const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                        return (
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => toggleExcludeWeek(dateStr)}
                            style={{
                              padding: '0.5rem 1rem',
                              fontSize: '1rem',
                              backgroundColor: excluded ? '#333333' : '#ffffff',
                              color: excluded ? '#666666' : '#000000',
                              border: excluded ? '1px solid #555555' : '2px solid #ffffff',
                              cursor: 'pointer',
                              fontFamily: 'Arial, sans-serif',
                              textDecoration: excluded ? 'line-through' : 'none',
                              opacity: excluded ? 0.5 : 1,
                            }}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        <button
          onClick={handleSend}
          disabled={loading || !isFormValid()}
          style={{
            padding: '1rem',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            backgroundColor: loading || !isFormValid() ? '#333333' : '#000000',
            color: '#ffffff',
            border: '2px solid #ffffff',
            cursor: loading || !isFormValid() ? 'not-allowed' : 'pointer',
            fontFamily: 'Arial, sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            opacity: loading || !isFormValid() ? 0.5 : 1,
            width: '100%',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.textDecoration = 'underline'
            if (!loading && isFormValid()) {
              e.currentTarget.style.backgroundColor = '#ffffff'
              e.currentTarget.style.color = '#000000'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = 'none'
            if (!loading && isFormValid()) {
              e.currentTarget.style.backgroundColor = '#000000'
              e.currentTarget.style.color = '#ffffff'
            }
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}
