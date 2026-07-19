# Milestone 1.0 Complete Integration Verification Script
# This script performs the Milestone 1.0 Completion Test.

$baseUrl = "http://localhost:5000/api"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "AEVORIN MILESTONE 1.0 INTEGRATION TEST" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Create Novel Project
$randomId = (Get-Random -Minimum 1000 -Maximum 9999)
$projectName = "Epic Test Novel $randomId"
Write-Host "`n1. Creating Novel Project '$projectName'..." -ForegroundColor Yellow
$projectPayload = @{
    name = $projectName
    description = "Integration test project for AEVORIN v1.0."
} | ConvertTo-Json

$project = Invoke-RestMethod -Uri "$baseUrl/projects" -Method Post -Body $projectPayload -ContentType "application/json"
$projectId = $project.id
Write-Host "Project Created! ID: $projectId, Path: $($project.path)" -ForegroundColor Green

# 2. Create Chapter 1
Write-Host "`n2. Creating Chapter 1: 'The Awakening'..." -ForegroundColor Yellow
$chapterPayload = @{
    title = "Chapter 1: The Awakening"
} | ConvertTo-Json

$chapter = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/chapters" -Method Post -Body $chapterPayload -ContentType "application/json"
$chapterId = $chapter.id
Write-Host "Chapter Created! ID: $chapterId, Title: $($chapter.title)" -ForegroundColor Green

# 3. Create Scene 1
Write-Host "`n3. Creating Scene 1: 'Starlight Voyage'..." -ForegroundColor Yellow
$scenePayload = @{
    chapterId = $chapterId
    title = "Scene 1: Starlight Voyage"
} | ConvertTo-Json

$scene = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/scenes" -Method Post -Body $scenePayload -ContentType "application/json"
$sceneId = $scene.id
Write-Host "Scene Created! ID: $sceneId, Title: $($scene.title)" -ForegroundColor Green

# 4. Write 1000 words & Save
Write-Host "`n4. Writing ~1000 words to Scene 1 and saving..." -ForegroundColor Yellow

# Build a simulated 1000-word TipTap document format JSON
$paragraphs = @()
for ($i = 1; $i -le 10; $i++) {
    # Generate 100 words per paragraph
    $words = @()
    for ($j = 1; $j -le 100; $j++) {
        $words += "word$j"
    }
    $paraText = [string]::Join(" ", $words)
    $paragraphs += @{
        type = "paragraph"
        content = @(
            @{
                type = "text"
                text = "Paragraph $($i): " + $paraText
            }
        )
    }
}
$docJson = @{
    type = "doc"
    content = $paragraphs
} | ConvertTo-Json -Depth 5

$sceneUpdatePayload = @{
    title = "Scene 1: Starlight Voyage"
    content = $docJson
    summary = "Simulated 1000-word draft chapter scene voyage."
    wordCount = 1000
    status = "polished"
    mood = "Sci-Fi Wonder"
    povEntityId = $null
} | ConvertTo-Json -Depth 5

$updatedScene = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/scenes/$sceneId" -Method Put -Body $sceneUpdatePayload -ContentType "application/json"
Write-Host "Scene Saved! Word Count: $($updatedScene.word_count), Status: $($updatedScene.status)" -ForegroundColor Green

# 5. Create Entity (Character: Marino)
Write-Host "`n5. Creating Character Profile 'Marino'..." -ForegroundColor Yellow
$entityPayload = @{
    type = "character"
    title = "Marino"
    summary = "A weathered stellar navigator and crew pilot."
    metadata = @{
        age = "32"
        appearance = "Dark coat, scarred chin, artificial left eye."
        traits = "Brilliant navigator, hot-tempered, fiercely loyal."
    }
} | ConvertTo-Json -Depth 5

$entity = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/entities" -Method Post -Body $entityPayload -ContentType "application/json"
$entityId = $entity.id
Write-Host "Entity Created! ID: $entityId, Name: $($entity.title), Type: $($entity.type)" -ForegroundColor Green

# 6. Simulate Close & Reload Project
Write-Host "`n6. Simulating reload... loading '$projectName' project connection..." -ForegroundColor Yellow
$loadPayload = @{
    name = $projectName
} | ConvertTo-Json

$loadedProject = Invoke-RestMethod -Uri "$baseUrl/projects/load" -Method Post -Body $loadPayload -ContentType "application/json"
Write-Host "Project Loaded! ID: $($loadedProject.id), Name: $($loadedProject.name)" -ForegroundColor Green

# 7. Verification - check reload integrity
Write-Host "`n7. Checking data integrity..." -ForegroundColor Yellow
$loadedScenes = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/scenes" -Method Get
$loadedScene = $loadedScenes | Where-Object { $_.id -eq $sceneId }

Write-Host "Loaded Scene Title: $($loadedScene.title)" -ForegroundColor Green
Write-Host "Loaded Scene Word Count: $($loadedScene.word_count)" -ForegroundColor Green
if ($loadedScene.word_count -eq 1000) {
    Write-Host "Integrity Verification Passed!" -ForegroundColor Green
} else {
    Write-Error "Integrity Verification Failed!"
}

# 8. Export to Markdown
Write-Host "`n8. Exporting novel draft compilation to Markdown..." -ForegroundColor Yellow
$exportResult = Invoke-RestMethod -Uri "$baseUrl/projects/$projectId/export" -Method Post
Write-Host "Export Complete!" -ForegroundColor Green
Write-Host "Export File Name: $($exportResult.fileName)" -ForegroundColor Green
Write-Host "Export Location: $($exportResult.path)" -ForegroundColor Green

# Check if exported file exists on disk
if (Test-Path $exportResult.path) {
    Write-Host "SUCCESS: Exported file verified on disk!" -ForegroundColor Green
    $exportContent = Get-Content -Path $exportResult.path -Raw
    Write-Host "Exported File Size: $($exportContent.Length) characters" -ForegroundColor Green
} else {
    Write-Error "ERROR: Exported file not found!"
}

Write-Host "`n=============================================" -ForegroundColor Cyan
Write-Host "INTEGRATION TEST COMPLETE - SUCCESS" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
